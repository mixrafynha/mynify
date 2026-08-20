import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { queueDesignAssetJobs } from "@/app/api/user-products/save-design/queue-design-assets";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseJsonIfString<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value ?? fallback) as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function hasArtwork(designData: any) {
  const front = Array.isArray(designData?.sides?.front?.elements) ? designData.sides.front.elements : [];
  const back = Array.isArray(designData?.sides?.back?.elements) ? designData.sides.back.elements : [];
  return [...front, ...back].some((el) => {
    if (!el || typeof el !== "object") return false;
    const record = el as Record<string, unknown>;
    if (record.meta && typeof record.meta === "object" && (record.meta as Record<string, unknown>).hidden === true) return false;
    return ["image", "text", "shape"].includes(String(record.type || ""));
  });
}

function extractStatus(record: any) {
  const direct = safeText(record?.print_files?.status || record?.print_files?.printFileStatus || record?.design_data?.printFileStatus);
  if (direct) return direct;
  const jobStatus = safeText(record?.design_data?.production?.jobs?.printFile?.status);
  return jobStatus || "missing";
}

export async function POST() {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "User not authenticated" }, { status: 401 });
    }
    const serviceSupabase = createSupabaseAdmin();

    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select("id, user_product_id, design_id")
      .eq("user_id", user.id);

    if (cartError) {
      return NextResponse.json({ ok: false, error: cartError.message }, { status: 500 });
    }

    const userProductIds = [...new Set(
      (cartItems ?? [])
        .flatMap((item: any) => [safeText(item.user_product_id), safeText(item.design_id)])
        .filter(Boolean),
    )];

    const { data: userProducts, error: userProductError } = userProductIds.length
      ? await supabase
          .from("user_products")
          .select("id, print_files, design_data, design_front, design_back")
          .eq("user_id", user.id)
          .in("id", userProductIds)
      : { data: [], error: null };

    if (userProductError) {
      return NextResponse.json({ ok: false, error: userProductError.message }, { status: 500 });
    }

    const byId = new Map((userProducts ?? []).map((row: any) => [row.id, row]));
    const results: Array<{ userProductId: string; status: string; queued: boolean }> = [];

    for (const userProductId of userProductIds) {
      const record = byId.get(userProductId);
      if (!record) continue;

      const status = extractStatus(record);
      const designData = parseJsonIfString<any>(record.design_data, {});
      const hasJobRecently =
        Boolean(designData?.printFileRequestedAt) &&
        Date.now() - new Date(designData.printFileRequestedAt).getTime() < 5 * 60 * 1000;

      let queued = false;
      if ((status === "missing" || status === "pending") && hasArtwork(designData) && !hasJobRecently) {
        const backgroundJobs = await queueDesignAssetJobs({
          userProductId,
          designData,
          designFront: record.design_front,
          designBack: record.design_back,
        });
        queued = Boolean(backgroundJobs.queued);

        if (queued) {
          const timestamp = new Date().toISOString();
          await serviceSupabase
            .from("user_products")
            .update({
              design_data: {
                ...designData,
                printFileStatus: "processing",
                printFileRequestedAt: timestamp,
                printFileRunId: backgroundJobs.printFileRunId ?? designData?.printFileRunId ?? null,
                production: {
                  ...(designData.production || {}),
                  jobs: {
                    ...(designData.production?.jobs || {}),
                    printFile: {
                      ...(designData.production?.jobs?.printFile || {}),
                      status: "processing",
                      requestedAt: timestamp,
                      runId: backgroundJobs.printFileRunId ?? null,
                    },
                  },
                },
              },
              print_files: {
                ...(parseJsonIfString<any>(record.print_files, {}) || {}),
                status: "processing",
                requested_at: timestamp,
                run_id: backgroundJobs.printFileRunId ?? null,
              },
            })
            .eq("id", userProductId)
            .eq("user_id", user.id);
        }
      }

      results.push({ userProductId, status: queued ? "processing" : status, queued });
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to prepare design assets" },
      { status: 500 },
    );
  }
}
