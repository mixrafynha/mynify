import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  fetchExactGelatoProduct,
  getGelatoCatalog,
  searchGelatoCatalogProducts,
  validateAttributeFilters,
} from "@/lib/gelato/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: Request,
  { params }: { params: { catalogUid?: string } },
) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const catalogUid = params?.catalogUid?.trim();
    if (!catalogUid) {
      return NextResponse.json({ error: "Missing catalogUid." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const productUid =
      typeof body?.productUid === "string" ? body.productUid.trim() : "";
    const filters = productUid ? {} : body?.attributeFilters ?? {};
    const limit = Number(body?.limit ?? 100);
    const offset = Number(body?.offset ?? 0);

    const catalog = await getGelatoCatalog(catalogUid);
    const validatedFilters = validateAttributeFilters(catalog, filters);
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, limit)) : 100;
    const safeOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;

    if (productUid) {
      const exact = await fetchExactGelatoProduct(catalogUid, productUid, {});

      return NextResponse.json({
        catalog,
        attributeFilters: {},
        products: [exact.matchedProduct],
        hits: null,
        total: 1,
        limit: 1,
        offset: 0,
      });
    }

    const result = await searchGelatoCatalogProducts(
      catalogUid,
      validatedFilters,
      safeLimit,
      safeOffset,
    );

    return NextResponse.json({
      catalog,
      attributeFilters: validatedFilters,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to search Gelato catalog products.",
      },
      { status: 500 },
    );
  }
}
