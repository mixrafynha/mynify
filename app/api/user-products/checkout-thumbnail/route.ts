import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import sharp from "sharp";
import { dataUrlToBuffer } from "../save-design/image-utils";
import { uploadBufferToR2 } from "../save-design/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function parseJsonIfString<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value ?? fallback) as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safePart(value: unknown) {
  return String(value || "thumbnail")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100) || "thumbnail";
}

function statusObject(existing: Record<string, unknown> | null | undefined) {
  const value = existing?.checkout_thumbnail_status;
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function currentVersion(existing: Record<string, unknown> | null | undefined) {
  const frontVersion = Number(existing?.checkout_thumbnail_front_version);
  const backVersion = Number(existing?.checkout_thumbnail_back_version);
  const version = Math.max(
    Number.isFinite(frontVersion) ? frontVersion : 0,
    Number.isFinite(backVersion) ? backVersion : 0,
  );

  return version > 0 ? version + 1 : 1;
}

function checkoutThumbnailState(
  mockups: Record<string, unknown> | null | undefined,
  side: "front" | "back",
) {
  if (side === "front") {
    return {
      url: typeof mockups?.checkout_thumbnail_url === "string" ? mockups.checkout_thumbnail_url : null,
      status:
        typeof mockups?.checkout_thumbnail_status === "object" && !Array.isArray(mockups.checkout_thumbnail_status)
          ? (mockups.checkout_thumbnail_status as Record<string, any>).front ?? null
          : null,
    };
  }

  return {
    url: typeof mockups?.checkout_thumbnail_back_url === "string" ? mockups.checkout_thumbnail_back_url : null,
    status:
      typeof mockups?.checkout_thumbnail_status === "object" && !Array.isArray(mockups.checkout_thumbnail_status)
        ? (mockups.checkout_thumbnail_status as Record<string, any>).back ?? null
        : null,
  };
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
  return error ? null : { user: data.user, supabase };
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth?.user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const { user, supabase } = auth;

    const body = await req.json();
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[THUMB_API_RECEIVED]",
        JSON.stringify({
          userProductId:
            typeof body?.userProductId === "string" ? body.userProductId : null,
          side:
            typeof body?.side === "string" ? body.side : null,
          payloadSize: JSON.stringify(body || {}).length,
        }),
      );
    }

    if (!body?.dataUrl || typeof body.dataUrl !== "string") {
      return NextResponse.json(
        { ok: false, code: "INVALID_PAYLOAD", error: "Missing imageData" },
        { status: 400 },
      );
    }

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

    const side =
      typeof body?.side === "string" && body.side.trim().toLowerCase() === "back"
        ? "back"
        : "front";

    const userProductId =
      typeof body?.userProductId === "string" && body.userProductId.trim()
        ? body.userProductId.trim()
        : typeof body?.designId === "string" && body.designId.trim()
          ? body.designId.trim()
          : null;

    if (userProductId) {
      const { data: record } = await supabase
        .from("user_products")
        .select("id, user_id, mockups")
        .eq("id", userProductId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (record) {
        const mockups = parseJsonIfString<any>(record.mockups, {});
        const existingStatus = statusObject(mockups);
        const timestamp = new Date().toISOString();
        const nextVersion = currentVersion(mockups);

        await supabase
          .from("user_products")
          .update({
            mockups: {
              ...mockups,
              checkout_thumbnail_url:
                side === "front" ? uploaded.url : mockups.checkout_thumbnail_url ?? null,
              checkout_thumbnail_back_url:
                side === "back" ? uploaded.url : mockups.checkout_thumbnail_back_url ?? null,
              checkout_thumbnail_status: {
                ...existingStatus,
                [side]: "ready",
              },
              checkout_thumbnail_front_version:
                side === "front"
                  ? nextVersion
                  : mockups.checkout_thumbnail_front_version ?? null,
              checkout_thumbnail_back_version:
                side === "back"
                  ? nextVersion
                  : mockups.checkout_thumbnail_back_version ?? null,
              checkout_thumbnail_front_source:
                side === "front" ? "editor" : mockups.checkout_thumbnail_front_source ?? null,
              checkout_thumbnail_back_source:
                side === "back" ? "editor" : mockups.checkout_thumbnail_back_source ?? null,
              checkout_thumbnail_front_updated_at:
                side === "front" ? timestamp : mockups.checkout_thumbnail_front_updated_at ?? null,
              checkout_thumbnail_back_updated_at:
                side === "back" ? timestamp : mockups.checkout_thumbnail_back_updated_at ?? null,
            },
          })
          .eq("id", userProductId)
          .eq("user_id", user.id);

        const { data: updatedRecord } = await supabase
          .from("user_products")
          .select("id, mockups")
          .eq("id", userProductId)
          .eq("user_id", user.id)
          .maybeSingle();

        const savedMockups = parseJsonIfString<any>(updatedRecord?.mockups ?? {}, {});
        const savedThumbnail = checkoutThumbnailState(savedMockups, side);
        const frontReady = Boolean(checkoutThumbnailState(savedMockups, "front").url);
        const backReady = Boolean(checkoutThumbnailState(savedMockups, "back").url);
        const legacyReady = Boolean(savedMockups.checkout_thumbnail_url);

        if (!savedThumbnail?.url) {
          return NextResponse.json(
            {
              ok: false,
              side,
              code: "THUMBNAIL_PERSISTENCE_FAILED",
              message: "Checkout thumbnail was uploaded but not persisted.",
            },
            { status: 500 },
          );
        }

        await supabase
          .from("cart_items")
          .update({
            image: uploaded.url,
            mockup_url: uploaded.url,
          })
          .or(`user_product_id.eq.${userProductId},design_id.eq.${userProductId}`);

        if (process.env.NODE_ENV === "development") {
          console.log(
            "[THUMB_DB_BEFORE]",
            JSON.stringify({
              userProductId,
              side,
              hasLegacyThumbnail: Boolean(mockups.checkout_thumbnail_url),
              hasCheckoutThumbnails: Boolean(mockups.checkout_thumbnail_back_url || mockups.checkout_thumbnail_url),
            }),
          );
          console.log(
            "[THUMB_DB_AFTER]",
            JSON.stringify({
              userProductId,
              side,
              frontReady,
              backReady,
              legacyReady,
            }),
          );
        }

        return NextResponse.json({
          ok: true,
          side,
          url: uploaded.url,
          savedPath:
            side === "front"
              ? "mockups.checkout_thumbnail_url"
              : "mockups.checkout_thumbnail_back_url",
          urlPresent: Boolean(savedThumbnail?.url),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      side,
      url: uploaded.url,
      savedPath:
        side === "front"
          ? "mockups.checkout_thumbnail_url"
          : "mockups.checkout_thumbnail_back_url",
    });
  } catch (error) {
    console.error("CHECKOUT_THUMBNAIL_UPLOAD_ERROR", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to upload checkout thumbnail",
      },
      { status: 500 },
    );
  }
}
