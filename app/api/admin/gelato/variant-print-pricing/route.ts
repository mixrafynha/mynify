import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { resolveGelatoPrintPricingForVariant } from "@/lib/gelato/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const productVariantId = typeof body?.productVariantId === "string" ? body.productVariantId.trim() : "";
    const countryCode = typeof body?.countryCode === "string" ? body.countryCode.trim() : "";
    const currency = typeof body?.currency === "string" ? body.currency.trim() : "";

    if (!productVariantId) {
      return NextResponse.json({ ok: false, error: "Missing productVariantId." }, { status: 400 });
    }
    if (!countryCode) {
      return NextResponse.json({ ok: false, error: "Missing countryCode." }, { status: 400 });
    }
    if (!currency) {
      return NextResponse.json({ ok: false, error: "Missing currency." }, { status: 400 });
    }

    const result = await resolveGelatoPrintPricingForVariant({
      productVariantId,
      countryCode,
      currency,
    });

    console.info("[gelato:variant-print-pricing]", {
      variantId: result.variantId,
      color: result.color,
      size: result.size,
      countryCode: result.countryCode,
      currency: result.currency,
      frontUid: result.frontUid,
      frontBackUid: result.frontBackUid,
      frontCost: result.frontCost,
      frontBackCost: result.frontBackCost,
      additionalBackCost: result.additionalBackCost,
      cacheUpdated: result.cacheUpdated,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to enrich Gelato print pricing." },
      { status: 500 },
    );
  }
}
