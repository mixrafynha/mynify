import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId")?.trim() ?? "";
    if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: job, error: jobError } = await supabase
      .from("gelato_sync_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();
    if (jobError) throw new Error(jobError.message);
    if (!job) return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });

    const { data: items, error: itemsError } = await supabase
      .from("gelato_sync_job_items")
      .select("id, gelato_product_uid, color, size, position, status, attempts, error, started_at, completed_at")
      .eq("job_id", jobId)
      .order("position", { ascending: true });
    if (itemsError) throw new Error(itemsError.message);

    const total = (items ?? []).length || Number(job.total_variants ?? 0);
    const completed = (items ?? []).filter((item) => item.status === "completed").length;
    const failed = (items ?? []).filter((item) => item.status === "failed").length;
    const pending = (items ?? []).filter((item) => item.status === "pending").length;
    const processing = (items ?? []).filter((item) => item.status === "processing").length;
    const processed = completed + failed;
    const canComplete =
      total > 0 &&
      total === Number(job.total_variants ?? 0) &&
      processed === total &&
      pending === 0 &&
      processing === 0;
    const inconsistent = Number(job.total_variants ?? 0) > 0 && total === 0;
    const itemProductUids = Array.from(
      new Set((items ?? []).map((item) => item.gelato_product_uid).filter(Boolean)),
    );
    let variantCosts: Array<Record<string, unknown>> = [];

    if (itemProductUids.length > 0) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, name, size, gelato_product_uid, product_color_id, price")
        .in("gelato_product_uid", itemProductUids);
      const variantIds = (variants ?? []).map((variant) => variant.id).filter(Boolean);
      const { data: colors } = variantIds.length > 0
        ? await supabase
            .from("product_colors")
            .select("id, color")
            .in("id", (variants ?? []).map((variant) => variant.product_color_id).filter(Boolean))
        : { data: [] };
      const { data: markets } = variantIds.length > 0
        ? await supabase
            .from("gelato_variant_markets")
            .select("product_variant_id, country_code, currency, quantity, product_price, price_checked_at")
            .in("product_variant_id", variantIds)
            .eq("country_code", "FR")
            .eq("quantity", 1)
        : { data: [] };
      const colorsById = new Map((colors ?? []).map((color) => [color.id, color.color]));
      const marketsByVariantId = new Map(
        (markets ?? [])
          .filter((market) => market.product_price !== null)
          .map((market) => [market.product_variant_id, market]),
      );

      variantCosts = (variants ?? []).map((variant) => {
        const market = marketsByVariantId.get(variant.id);
        return {
          gelato_product_uid: variant.gelato_product_uid,
          name: variant.name,
          color: colorsById.get(variant.product_color_id) ?? null,
          size: variant.size,
          cost_fr: market?.product_price ?? variant.price ?? null,
          currency: market?.currency ?? null,
          last_synced_at: market?.price_checked_at ?? null,
        };
      });
    }

    return NextResponse.json({
      ok: true,
      job: {
        ...job,
        total_variants: total,
        processed_variants: processed,
        successful_variants: completed,
        failed_variants: failed,
        completed_variants: completed,
        failed_items: failed,
        pending_items: pending,
        processing_items: processing,
        can_complete: canComplete,
        inconsistent,
        variant_costs: variantCosts,
      },
      items: items ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to read Gelato family sync status." },
      { status: 500 },
    );
  }
}
