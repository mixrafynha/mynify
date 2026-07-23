import { createSupabaseServer } from "@/lib/supabase-server";
import { getAvailableVariants } from "./_variant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CartVariantRelation = {
  id: string;
  stock: number | null;
  size: string | null;
  price: number | string | null;
  sku: string | null;
  product_color_id: string | null;
  gelato_product_uid: string | null;
};

type CartItem = {
  id: string;
  product_id: string;
  user_product_id: string | null;
  variant_id: string | null;
  title: string | null;
  price: number | string | null;
  currency: string | null;
  quantity: number | null;
  color: string | null;
  size: string | null;
  sku: string | null;
  image: string | null;
  created_at: string | null;
  product_variants?: CartVariantRelation | CartVariantRelation[] | null;
};

type UserProductRelation = {
  id: string;
  base_product_id: string | null;
  print_files: Record<string, unknown> | null;
  mockups: Record<string, unknown> | null;
  design_data: Record<string, unknown> | null;
};

type UserProductAssets = {
  user_product_id: string | null;
  base_product_id: string | null;
  print_files: Record<string, unknown> | null;
  printFiles: Record<string, unknown> | null;
  mockups: Record<string, unknown> | null;
  design_data: Record<string, unknown> | null;
  designData: Record<string, unknown> | null;
};

type SupabaseManyResponse<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function publicString(value: unknown): string | null {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
}

function frontMockupUrl(mockups: Record<string, unknown> | null): string | null {
  if (!mockups) return null;
  return (
    publicString(mockups.checkout_thumbnail_url) ??
    publicString(mockups.checkoutThumbnailUrl) ??
    publicString(mockups.front) ??
    publicString(mockups.mockup_front) ??
    publicString(mockups.image)
  );
}

async function resolveUserProductAssets(
  supabase: ReturnType<typeof createSupabaseServer>,
  userProductId: string | null,
): Promise<UserProductAssets> {
  if (!userProductId) {
    return {
      user_product_id: null,
      base_product_id: null,
      print_files: null,
      printFiles: null,
      mockups: null,
      design_data: null,
      designData: null,
    };
  }

  const { data } = (await supabase
    .from("user_products")
    .select("id, base_product_id, print_files, mockups, design_data")
    .eq("id", userProductId)
    .maybeSingle()) as { data: UserProductRelation | null; error: { message: string } | null };

  if (!data) {
    return {
      user_product_id: null,
      base_product_id: null,
      print_files: null,
      printFiles: null,
      mockups: null,
      design_data: null,
      designData: null,
    };
  }

  return {
    user_product_id: data.id,
    base_product_id: data.base_product_id,
    print_files: data.print_files,
    printFiles: data.print_files,
    mockups: data.mockups,
    design_data: data.design_data,
    designData: data.design_data,
  };
}

export async function GET() {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const { data, error } = (await supabase
      .from("cart_items")
      .select(`
        id,
        product_id,
        user_product_id,
        variant_id,
        title,
        price,
        currency,
        quantity,
        color,
        size,
        sku,
        image,
        created_at,
        product_variants!cart_items_variant_id_fkey (
          id,
          stock,
          size,
          price,
          sku,
          product_color_id,
          gelato_product_uid
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })) as SupabaseManyResponse<CartItem>;

    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }

    const items = await Promise.all(
      (data ?? []).map(async (item) => {
        const availableVariants = await getAvailableVariants(supabase, item.product_id);
        const selectedVariant = availableVariants.find((variant) => variant.id === item.variant_id) ?? null;
        const variantRelation = firstRelation(item.product_variants);

        const userProductAssets = await resolveUserProductAssets(supabase, item.user_product_id);

        const gelatoProductUid = variantRelation?.gelato_product_uid ?? selectedVariant?.gelato_product_uid ?? null;
        const mockupImage = frontMockupUrl(userProductAssets.mockups);

        return {
          ...item,
          ...userProductAssets,
          image: mockupImage ?? item.image,
          product_variants: variantRelation,
          product_uid: gelatoProductUid,
          productUid: gelatoProductUid,
          gelato_product_uid: gelatoProductUid,
          gelatoProductUid: gelatoProductUid,
          stock: variantRelation?.stock ?? selectedVariant?.stock ?? null,
          selectedVariant,
          availableVariants,
          variants: availableVariants,
        };
      }),
    );

    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Server error", details: message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
