import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import {
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
    const result = await searchGelatoCatalogProducts(
      catalogUid,
      validatedFilters,
      Number.isFinite(limit) ? Math.max(1, Math.min(100, limit)) : 100,
      Number.isFinite(offset) ? Math.max(0, offset) : 0,
    );

    const products = productUid
      ? result.products.filter((product) => product.productUid === productUid)
      : result.products;

    return NextResponse.json({
      catalog,
      attributeFilters: validatedFilters,
      ...result,
      products,
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
