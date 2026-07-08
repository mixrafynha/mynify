import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "user_generated_images";
const SAVE_LIMIT = 5;

const jsonHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    },
  );
}

function getImageUrl(body: any) {
  return String(
    body?.imageUrl ||
      body?.image_url ||
      body?.printUrl ||
      body?.src ||
      body?.url ||
      "",
  ).trim();
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: jsonHeaders });
}

export async function GET() {
  try {
    const supabase = await getSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return json({ success: false, images: [], savedCount: 0, savedLimit: SAVE_LIMIT }, 401);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .select(
        "id,generation_id,prompt,image_url,storage_key,created_at,original_image_url,is_saved,saved_at",
      )
      .eq("user_id", user.id)
      .eq("is_saved", true)
      .order("saved_at", { ascending: false })
      .limit(SAVE_LIMIT);

    if (error) {
      return json(
        {
          success: false,
          images: [],
          savedCount: 0,
          savedLimit: SAVE_LIMIT,
          error: "Could not load saved AI images",
        },
        500,
      );
    }

    const images = (data ?? []).filter((item) => {
      const url = String(item.image_url || "").trim();
      return url.startsWith("http://") || url.startsWith("https://");
    });

    return json({
      success: true,
      images,
      savedCount: images.length,
      savedLimit: SAVE_LIMIT,
    });
  } catch {
    return json(
      {
        success: false,
        images: [],
        savedCount: 0,
        savedLimit: SAVE_LIMIT,
        error: "Could not load saved AI images",
      },
      500,
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const imageUrl = getImageUrl(body);
    const storageKey = String(body?.storage_key || body?.r2Key || "").trim();
    const generationId = String(body?.generationId || body?.generation_id || "").trim();

    if (!imageUrl) {
      return json({ success: false, error: "Missing image URL" }, 400);
    }

    const { count, error: countError } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_saved", true);

    if (countError) {
      return json({ success: false, error: "Could not check saved image limit" }, 500);
    }

    if ((count || 0) >= SAVE_LIMIT) {
      return json(
        {
          success: false,
          error: "You've reached your saved image limit. Delete one of your saved images or upgrade your plan.",
          savedCount: count || 0,
          savedLimit: SAVE_LIMIT,
        },
        409,
      );
    }

    const payload = {
      user_id: user.id,
      generation_id: generationId || null,
      prompt: body?.prompt || body?.title || null,
      image_url: imageUrl,
      storage_key: storageKey || null,
      original_image_url: body?.originalImageUrl || body?.original_image_url || null,
      is_saved: true,
      saved_at: new Date().toISOString(),
    };

    const { data: savedImage, error: saveError } = await supabase
      .from(TABLE)
      .insert(payload)
      .select(
        "id,generation_id,prompt,image_url,storage_key,created_at,original_image_url,is_saved,saved_at",
      )
      .single();

    if (saveError) {
      console.error("USER_GENERATED_IMAGES_SAVE_ERROR:", saveError);

      return json(
        {
          success: false,
          error: "Could not save image",
          details: saveError.message,
        },
        500,
      );
    }

    return json({
      success: true,
      image: savedImage,
      savedCount: (count || 0) + 1,
      savedLimit: SAVE_LIMIT,
    });
  } catch {
    return json({ success: false, error: "Could not save image" }, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await getSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "").trim();

    if (!id) {
      return json({ success: false, error: "Missing image id" }, 400);
    }

    const { data: image, error: findError } = await supabase
      .from(TABLE)
      .select("id,user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (findError) {
      return json({ success: false, error: "Could not find image" }, 500);
    }

    if (!image) {
      return json({ success: false, error: "Image not found" }, 404);
    }

    const { error: deleteError } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("USER_GENERATED_IMAGES_DELETE_ERROR:", deleteError);

      return json(
        {
          success: false,
          error: "Could not remove image",
          details: deleteError.message,
        },
        500,
      );
    }

    const { count } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_saved", true);

    return json({
      success: true,
      deletedId: id,
      savedCount: count || 0,
      savedLimit: SAVE_LIMIT,
    });
  } catch {
    return json({ success: false, error: "Could not remove image" }, 500);
  }
}
