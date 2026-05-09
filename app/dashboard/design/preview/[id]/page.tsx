import { createSupabaseServer } from "@/lib/supabase-server";

export default async function PreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServer();

  const { data: product } = await supabase
    .from("user_products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Product not found
      </div>
    );
  }

  // ================= MOCKUP =================
  const category = (
    product.category ||
    product.title ||
    ""
  ).toLowerCase();

  let mockup = "/mockups/hoodie-front.png";

  if (
    category.includes("shirt") ||
    category.includes("tshirt") ||
    category.includes("t-shirt")
  ) {
    mockup = "/mockups/tshirt-front.png";
  }

  const elements = product.design_front || [];

  return (
    <div className="min-h-screen bg-[#f6f6f4] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {product.title}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Custom product preview
          </p>
        </div>

        {/* MOCKUP AREA */}
        <div className="flex items-center justify-center">
          <div className="relative w-[420px] h-[520px]">

            {/* MOCKUP */}
            <img
              src={mockup}
              alt={product.title}
              className="absolute inset-0 z-10 w-full h-full object-contain"
            />

            {/* DESIGN ELEMENTS */}
            {elements.map((el: any) => {
              const color =
                el.meta?.color ||
                el.color ||
                "#000000";

              const fontFamily =
                el.meta?.fontFamily ||
                el.fontFamily ||
                "Arial";

              const fontSize =
                el.meta?.fontSize ||
                el.fontSize ||
                20;

              return (
                <div
                  key={el.id}
                  className="absolute z-20"
                  style={{
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: el.width || "auto",
                    height: el.height || "auto",

                    color,
                    fontFamily,
                    fontSize,

                    fontWeight:
                      el.meta?.fontWeight ||
                      el.fontWeight ||
                      "normal",

                    transform: el.rotation
                      ? `rotate(${el.rotation}deg)`
                      : undefined,
                  }}
                >
                  {/* TEXT */}
                  {el.type === "text" && (
                    <span>
                      {el.text ||
                        el.content ||
                        "Text"}
                    </span>
                  )}

                  {/* IMAGE */}
                  {el.type === "image" && el.src && (
                    <img
                      src={el.src}
                      alt=""
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  )}

                  {/* SHAPE */}
                  {el.type === "shape" && (
                    <div
                      className="rounded-md"
                      style={{
                        width: el.width || 100,
                        height: el.height || 100,
                        background:
                          color || "#000",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* INFO */}
        <div className="mt-8 border-t pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Final price
            </p>

            <p className="text-2xl font-bold">
              $
              {Number(
                product.final_price ||
                  product.price ||
                  0
              ).toFixed(2)}
            </p>
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-black text-white text-xs">
              Custom design
            </span>

            <span className="px-3 py-1 rounded-full bg-gray-100 text-xs">
              {product.category || "Product"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
