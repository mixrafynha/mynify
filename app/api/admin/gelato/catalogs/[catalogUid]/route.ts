import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getGelatoCatalog } from "@/lib/gelato/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
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

    const catalog = await getGelatoCatalog(catalogUid);
    return NextResponse.json({ catalog });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load Gelato catalog.",
      },
      { status: 500 },
    );
  }
}
