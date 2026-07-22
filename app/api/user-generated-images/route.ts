import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "user_generated_images";
const SAVE_LIMIT = 5;

const STARTER_IMAGES = [
  {
    generation_id: "starter-chinese-dragon",
    prompt: "Ancient Chinese dragon wrapped around a flaming katana",
    image_url: "https://pub-32be62cb2f1f47048c590acdfa322022.r2.dev/ai-images/5f40b207-96af-4fb6-b750-473f18ee8c1a/1ab2d445-cd18-4461-901f-aeabbe38436f-1783539471064.png",
    storage_key: "ai-images/5f40b207-96af-4fb6-b750-473f18ee8c1a/1ab2d445-cd18-4461-901f-aeabbe38436f-1783539471064.png",
  },
  {
    generation_id: "starter-astronaut-skull",
    prompt: "Astronaut skull wearing a cracked vintage space helmet",
    image_url: "https://pub-32be62cb2f1f47048c590acdfa322022.r2.dev/ai-images/5f40b207-96af-4fb6-b750-473f18ee8c1a/761af6ff-7391-440f-ba1e-48afbd798cb8-1783531346381.png",
    storage_key: "ai-images/5f40b207-96af-4fb6-b750-473f18ee8c1a/761af6ff-7391-440f-ba1e-48afbd798cb8-1783531346381.png",
  },
  {
    generation_id: "starter-black-panther",
    prompt: "Fierce black panther roaring with electric blue lightning",
    image_url: "https://pub-32be62cb2f1f47048c590acdfa322022.r2.dev/ai-images/5f40b207-96af-4fb6-b750-473f18ee8c1a/a63fe991-e737-4b0a-bf3b-10ee58dbf61d-1783434567640.png",
    storage_key: "ai-images/5f40b207-96af-4fb6-b750-473f18ee8c1a/a63fe991-e737-4b0a-bf3b-10ee58dbf61d-1783434567640.png",
  },
] as const;

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

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function seedStarterImagesOnce(user: { id: string; app_metadata?: Record<string, unknown> }) {
  if (user.app_metadata?.ai_starter_images_seeded === true) return;

  const serviceSupabase = getServiceSupabase();
  const { count, error: countError } = await serviceSupabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_saved", true);

  if (countError) throw countError;

  if ((count || 0) === 0) {
    const now = Date.now();
    const { error: insertError } = await serviceSupabase.from(TABLE).insert(
      STARTER_IMAGES.map((image, index) => ({
        user_id: user.id,
        ...image,
        original_image_url: image.image_url,
        is_saved: true,
        saved_at: new Date(now - index).toISOString(),
      })),
    );
    if (insertError) throw insertError;
  }

  const { error: metadataError } = await serviceSupabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...(user.app_metadata || {}),
      ai_starter_images_seeded: true,
    },
  });
  if (metadataError) throw metadataError;
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

    await seedStarterImagesOnce(user);

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
