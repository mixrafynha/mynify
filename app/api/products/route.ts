import { NextResponse } from "next/server";
import { getProducts } from "@/lib/services/productService";

export const revalidate = 300;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawLimit = Number(searchParams.get("limit") || 12);

    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 50)
      : 12;

    const category = searchParams.get("category")?.trim() || undefined;
    const collection = searchParams.get("collection")?.trim() || undefined;

    const result = await getProducts({
      limit,
      category,
      collection,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("GET_PRODUCTS_ERROR:", err);

    return NextResponse.json(
      {
        data: [],
        error: "Internal server error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
