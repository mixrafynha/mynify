import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { listGelatoCatalogs } from "@/lib/gelato/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const catalogs = await listGelatoCatalogs();
    return NextResponse.json({ catalogs });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list Gelato catalogs.",
      },
      { status: 500 },
    );
  }
}
