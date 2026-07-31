import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { searchGelatoProductFamily } from "@/lib/gelato/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const JOB_ITEM_INSERT_BATCH_SIZE = 100;

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

export async function POST(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
    const catalogUid = typeof body?.catalogUid === "string" ? body.catalogUid.trim() : "";
    const referenceProductUid = typeof body?.referenceProductUid === "string" ? body.referenceProductUid.trim() : "";
    if (!productId) return NextResponse.json({ ok: false, error: "Missing productId." }, { status: 400 });
    if (!catalogUid) return NextResponse.json({ ok: false, error: "Missing catalogUid." }, { status: 400 });
    if (!referenceProductUid) {
      return NextResponse.json({ ok: false, error: "Missing referenceProductUid." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { familyAttributes, familyProducts } = await searchGelatoProductFamily(catalogUid, referenceProductUid);
    const colors = Array.from(
      new Set(familyProducts.map((product) => product.attributes.GarmentColor).filter(Boolean)),
    ).slice(0, 20);
    const sizes = Array.from(
      new Set(familyProducts.map((product) => product.attributes.GarmentSize).filter(Boolean)),
    ).slice(0, 20);

    const { data: existingJob } = await supabase
      .from("gelato_sync_jobs")
      .select("id,status,total_variants,processed_variants,successful_variants,failed_variants,current_item_uid,current_error,started_at,last_processed_at,completed_at")
      .eq("product_id", productId)
      .eq("reference_product_uid", referenceProductUid)
      .in("status", ["pending", "discovering", "processing", "finalizing"])
      .maybeSingle();

    let jobId = existingJob?.id ?? null;
    let totalVariants = familyProducts.length;

    if (!jobId) {
      const { data: job, error: jobError } = await supabase
        .from("gelato_sync_jobs")
        .insert({
          product_id: productId,
          reference_product_uid: referenceProductUid,
          catalog_uid: catalogUid,
          family_key: familyAttributes.familyKey,
          status: "creating_items",
          total_variants: familyProducts.length,
          processed_variants: 0,
          successful_variants: 0,
          failed_variants: 0,
          current_item_uid: null,
          current_error: null,
        })
        .select("id")
        .single();
      if (jobError || !job?.id) throw new Error(jobError?.message || "Failed to create job.");
      jobId = job.id as string;

      const items = familyProducts.map((product, index) => ({
        job_id: jobId,
        gelato_product_uid: product.productUid,
        color: product.attributes.GarmentColor ?? null,
        size: product.attributes.GarmentSize ?? null,
        position: index + 1,
        status: "pending",
      }));
      for (const batch of chunk(items, JOB_ITEM_INSERT_BATCH_SIZE)) {
        const { error: itemsError } = await supabase
          .from("gelato_sync_job_items")
          .upsert(batch, {
            onConflict: "job_id,position",
            ignoreDuplicates: false,
          });
        if (itemsError) {
        await supabase
          .from("gelato_sync_jobs")
          .update({
            status: "failed",
            current_error: `Failed to create sync items: ${itemsError.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
          throw new Error(`Failed to create Gelato sync job items: ${itemsError.message}`);
        }
      }
    } else {
      if ((existingJob?.total_variants ?? 0) !== familyProducts.length) {
        await supabase
          .from("gelato_sync_jobs")
          .update({
            total_variants: familyProducts.length,
          })
          .eq("id", jobId);
      }

      const { count: insertedCount, error: countError } = await supabase
        .from("gelato_sync_job_items")
        .select("id", { count: "exact", head: true })
        .eq("job_id", jobId);
      if (countError) throw new Error(countError.message);
      if ((insertedCount ?? 0) === 0) {
        await supabase
          .from("gelato_sync_jobs")
          .update({
            status: "failed",
            current_error: "Job initialization incomplete: variants were discovered but no job items were created.",
          })
          .eq("id", jobId);
        return NextResponse.json(
          {
            ok: false,
            error: "Job initialization incomplete: variants were discovered but no job items were created.",
          },
          { status: 500 },
        );
      }
      totalVariants = insertedCount ?? 0;
    }

    const { count: finalCount, error: finalCountError } = await supabase
      .from("gelato_sync_job_items")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId);
    if (finalCountError) throw new Error(finalCountError.message);
    if ((finalCount ?? 0) !== familyProducts.length) {
      await supabase
        .from("gelato_sync_jobs")
        .update({
          status: "failed",
          current_error: `Job initialization incomplete: discovered ${familyProducts.length} variants but stored ${(finalCount ?? 0)} items.`,
        })
        .eq("id", jobId);
      return NextResponse.json(
        {
          ok: false,
          error: `Job initialization incomplete: discovered ${familyProducts.length} variants but stored ${(finalCount ?? 0)} items.`,
        },
        { status: 500 },
      );
    }

    await supabase
      .from("gelato_sync_jobs")
      .update({
        status: "pending",
        total_variants: totalVariants,
        current_error: null,
        started_at: existingJob?.started_at ?? new Date().toISOString(),
      })
      .eq("id", jobId);

    return NextResponse.json({
      ok: true,
      jobId,
      status: "pending",
      totalVariants,
      insertedItems: finalCount ?? 0,
      colors,
      sizes,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to start Gelato family sync." }, { status: 500 });
  }
}
