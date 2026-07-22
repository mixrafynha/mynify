import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { dataUrlToBuffer } from "../save-design/image-utils";
import { uploadBufferToR2 } from "../save-design/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function safePart(value: unknown) {
  return String(value || "image")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100) || "image";
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase environment variables");

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set({ name, value, ...options }); } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set({ name, value: "", ...options, maxAge: 0 }); } catch {}
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

    const body = await req.json();
    const parsed = dataUrlToBuffer(body?.dataUrl);

    if (!ALLOWED_IMAGE_TYPES.has(parsed.mimeType)) {
      return NextResponse.json({ error: `Unsupported image type: ${parsed.mimeType}` }, { status: 415 });
    }
    if (parsed.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image exceeds the 4 MB upload limit" }, { status: 413 });
    }

    const elementId = safePart(body?.elementId);
    const key = `users/${safePart(user.id)}/editor-elements/${elementId}-${crypto.randomUUID()}.${parsed.extension}`;
    const uploaded = await uploadBufferToR2({
      key,
      buffer: parsed.buffer,
      contentType: parsed.mimeType,
    });

    return NextResponse.json({ url: uploaded.url, key: uploaded.key });
  } catch (error) {
    console.error("DESIGN_ELEMENT_IMAGE_UPLOAD_ERROR", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload design image" },
      { status: 500 },
    );
  }
}
