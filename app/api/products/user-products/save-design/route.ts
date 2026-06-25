import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

type Side = "front" | "back";

type DataUrlUpload = {
  path: string | null;
  publicUrl: string | null;
};

const DESIGN_BUCKET =
  process.env.SUPABASE_DESIGN_BUCKET ||
  process.env.NEXT_PUBLIC_SUPABASE_DESIGN_BUCKET ||
  "design-assets";

function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function isDataImage(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/(png|webp|jpeg|jpg);base64,/i.test(value);
}

function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|webp|jpeg|jpg));base64,(.+)$/i);

  if (!match) {
    throw new Error("Invalid image data URL");
  }

  const mimeType = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const buffer = Buffer.from(match[2], "base64");

  return { buffer, mimeType, extension };
}

function cleanDataUrls(value: unknown): unknown {
  if (typeof value === "string") {
    return isDataImage(value) ? null : value;
  }

  if (Array.isArray(value)) {
    return value.map(cleanDataUrls);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output: Record<string, unknown> = {};

  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    output[key] = cleanDataUrls(item);
  });

  return output;
}

async function uploadDataImage(args: {
  supabase: ReturnType<typeof createSupabaseServer>;
  userId: string;
  designId: string;
  side: Side;
  kind: "print" | "mockup";
  dataUrl: unknown;
}): Promise<DataUrlUpload> {
  if (!isDataImage(args.dataUrl)) {
    return { path: null, publicUrl: null };
  }

  const { buffer, mimeType, extension } = dataUrlToBuffer(args.dataUrl);
  const storagePath = `${args.userId}/${args.designId}/${args.kind}/${args.side}.${extension}`;

  const { error } = await args.supabase.storage
    .from(DESIGN_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
      cacheControl: "31536000",
    });

  if (error) {
    throw new Error(`Storage upload failed (${args.kind}/${args.side}): ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = args.supabase.storage.from(DESIGN_BUCKET).getPublicUrl(storagePath);

  return {
    path: storagePath,
    publicUrl,
  };
}

function sideValue<T>(value: any, side: Side): T | null {
  if (!value) return null;
  if (typeof value === "string") return side === "front" ? value : null;
  if (typeof value === "object") return value[side] ?? null;
  return null;
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const baseProductId =
      body.baseProductId ||
      body.base_product_id ||
      body.productId ||
      body.product_id;

    if (!baseProductId) {
      return NextResponse.json(
        { error: "Base product ID missing" },
        { status: 400 },
      );
    }

    let productQuery = supabase
      .from("products")
      .select(`
        id,
        title,
        description,
        price,
        currency,
        image,
        images,
        category,
        slug
      `);

    productQuery = isUuid(baseProductId)
      ? productQuery.eq("id", baseProductId)
      : productQuery.or(`slug.eq.${baseProductId},category.eq.${baseProductId}`);

    const { data: baseProduct, error: productError } = await productQuery.maybeSingle();

    if (productError || !baseProduct) {
      console.error("PRODUCT ERROR:", productError);

      return NextResponse.json(
        { error: "Base product not found" },
        { status: 404 },
      );
    }

    const designId = isUuid(body.designId || body.id)
      ? String(body.designId || body.id)
      : crypto.randomUUID();

    const printFront = await uploadDataImage({
      supabase,
      userId: user.id,
      designId,
      side: "front",
      kind: "print",
      dataUrl:
        sideValue(body.printFiles, "front") ||
        body?.sides?.front?.designImage ||
        body?.design_data?.sides?.front?.designImage,
    });

    const printBack = await uploadDataImage({
      supabase,
      userId: user.id,
      designId,
      side: "back",
      kind: "print",
      dataUrl:
        sideValue(body.printFiles, "back") ||
        body?.sides?.back?.designImage ||
        body?.design_data?.sides?.back?.designImage,
    });

    const mockupFront = await uploadDataImage({
      supabase,
      userId: user.id,
      designId,
      side: "front",
      kind: "mockup",
      dataUrl: sideValue(body.mockups, "front"),
    });

    const mockupBack = await uploadDataImage({
      supabase,
      userId: user.id,
      designId,
      side: "back",
      kind: "mockup",
      dataUrl: sideValue(body.mockups, "back"),
    });

    const productMarkup = Number(body.markup || 0);
    const basePrice = Number(baseProduct.price || 0);
    const finalPrice = basePrice + productMarkup;

    const designData = cleanDataUrls(body.design_data || {
      schemaVersion: body.schemaVersion || 3,
      productId: baseProduct.id,
      category: baseProduct.category || body.category || null,
      color: body.color || body.mockupColor || null,
      mockupColor: body.mockupColor || body.color || null,
      sides: {
        front: {
          elements: body.designFront || body.design_front || [],
          printBox: body.printBox?.front || body.print_box?.front || null,
          safeArea: body.safeArea?.front || body.safe_area?.front || null,
          designImage: null,
          designImageUrl: printFront.publicUrl,
          printFileUrl: printFront.publicUrl,
          mockupUrl: mockupFront.publicUrl,
        },
        back: {
          elements: body.designBack || body.design_back || [],
          printBox: body.printBox?.back || body.print_box?.back || null,
          safeArea: body.safeArea?.back || body.safe_area?.back || null,
          designImage: null,
          designImageUrl: printBack.publicUrl,
          printFileUrl: printBack.publicUrl,
          mockupUrl: mockupBack.publicUrl,
        },
      },
      production: body.production || null,
    }) as any;

    if (designData?.sides?.front) {
      designData.sides.front.designImage = null;
      designData.sides.front.designImageUrl = printFront.publicUrl;
      designData.sides.front.printFileUrl = printFront.publicUrl;
      designData.sides.front.mockupUrl = mockupFront.publicUrl;
    }

    if (designData?.sides?.back) {
      designData.sides.back.designImage = null;
      designData.sides.back.designImageUrl = printBack.publicUrl;
      designData.sides.back.printFileUrl = printBack.publicUrl;
      designData.sides.back.mockupUrl = mockupBack.publicUrl;
    }

    const savePayload = {
      id: designId,
      user_id: user.id,
      base_product_id: baseProduct.id,
      title: baseProduct.title,
      description: baseProduct.description || null,
      price: basePrice,
      currency: baseProduct.currency || "USD",
      image: baseProduct.image || null,
      images: baseProduct.images || null,
      category: baseProduct.category || body.category || null,
      slug: `${baseProduct.slug || "product"}-${designId.slice(0, 8)}`,
      design_front: body.designFront || body.design_front || designData?.sides?.front?.elements || [],
      design_back: body.designBack || body.design_back || designData?.sides?.back?.elements || [],
      design_data: designData,
      print_files: {
        front: printFront.publicUrl,
        back: printBack.publicUrl,
        paths: {
          front: printFront.path,
          back: printBack.path,
        },
      },
      mockups: {
        front: mockupFront.publicUrl,
        back: mockupBack.publicUrl,
        paths: {
          front: mockupFront.path,
          back: mockupBack.path,
        },
      },
      print_box: body.printBox || body.print_box || {
        front: designData?.sides?.front?.printBox || null,
        back: designData?.sides?.back?.printBox || null,
      },
      safe_area: body.safeArea || body.safe_area || {
        front: designData?.sides?.front?.safeArea || null,
        back: designData?.sides?.back?.safeArea || null,
      },
      design_image_url: printFront.publicUrl || printBack.publicUrl || null,
      markup: productMarkup,
      final_price: finalPrice,
      status: body.status || "draft",
      cart_status: body.cartStatus || body.cart_status || "in_cart",
      is_active: true,
      design_version: body.schemaVersion || 3,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_products")
      .upsert(savePayload, {
        onConflict: "id",
      })
      .select()
      .single();

    if (error) {
      console.error("USER PRODUCT SAVE ERROR:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      designId: data.id,
      product: data,
      redirectTo: `/cart?designId=${data.id}`,
    });
  } catch (error: any) {
    console.error("Erro ao guardar produto com design:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao guardar produto com design",
      },
      { status: 500 },
    );
  }
}
