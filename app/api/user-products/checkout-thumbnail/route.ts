import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import sharp from "sharp";
import { dataUrlToBuffer } from "../save-design/image-utils";
import { uploadBufferToR2 } from "../save-design/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function safePart(value: unknown) {
  return String(value || "thumbnail")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100) || "thumbnail";
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {}
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = dataUrlToBuffer(body?.dataUrl);
    if (parsed.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Thumbnail exceeds 8 MB" }, { status: 413 });
    }

    const webp = await sharp(parsed.buffer)
      .webp({ quality: 84, effort: 2 })
      .toBuffer();
    const key = `users/${safePart(user.id)}/checkout-thumbnails/${crypto.randomUUID()}.webp`;
    const uploaded = await uploadBufferToR2({
      key,
      buffer: webp,
      contentType: "image/webp",
    });

    return NextResponse.json({ url: uploaded.url, key: uploaded.key });
  } catch (error) {
    console.error("CHECKOUT_THUMBNAIL_UPLOAD_ERROR", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload checkout thumbnail" },
      { status: 500 },
    );
  }
}
