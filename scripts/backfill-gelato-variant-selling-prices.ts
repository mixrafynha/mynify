import "dotenv/config";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { refreshProductVariantSellingPrices } from "@/lib/gelato/catalog-sync";

async function main() {
  const supabase = createSupabaseAdmin();
  const { data: products, error } = await supabase
    .from("products")
    .select("id")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const productIds = (products ?? [])
    .map((product) => product.id)
    .filter((id): id is string => Boolean(id));

  let processed = 0;
  let updatedVariants = 0;
  let updatedProductPrices = 0;
  let unsoldVariants = 0;

  for (const productId of productIds) {
    const result = await refreshProductVariantSellingPrices(productId);
    processed += 1;
    updatedVariants += result.updatedVariants;
    updatedProductPrices += result.updatedProductPrice !== null ? 1 : 0;
    unsoldVariants += result.unsoldVariants;

    console.info({
      event: "gelato_variant_price_backfill_progress",
      productId,
      updatedVariants: result.updatedVariants,
      updatedProductPrice: result.updatedProductPrice,
      unsoldVariants: result.unsoldVariants,
    });
  }

  console.info({
    event: "gelato_variant_price_backfill_completed",
    processed,
    updatedVariants,
    updatedProductPrices,
    unsoldVariants,
  });
}

main().catch((error) => {
  console.error("gelato_variant_price_backfill_failed", error);
  process.exitCode = 1;
});
