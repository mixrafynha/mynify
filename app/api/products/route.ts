import { NextResponse } from "next/server";
import { getProducts } from "@/lib/services/productService";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const limit = Math.min(Number(searchParams.get("limit") || 12), 50);
    const category = searchParams.get("category");
    const collection = searchParams.get("collection");

    const result = await getProducts({
      limit,
      category,
      collection,
    });

    return NextResponse.json(
      result,
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
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