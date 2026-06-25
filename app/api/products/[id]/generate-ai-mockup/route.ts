import Replicate from "replicate";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer();

  const { data: product } = await supabase
    .from("user_products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.design_image_url) {
    return NextResponse.json(
      { error: "Missing design_image_url" },
      { status: 400 }
    );
  }

  const isTshirt =
    product.category?.toLowerCase().includes("shirt") ||
    product.title?.toLowerCase().includes("shirt");

  const prompt = isTshirt
    ? "realistic ecommerce mockup of a white t-shirt worn by a model, front view, studio lighting, natural fabric folds, the uploaded design printed centered on the chest, premium streetwear product photo"
    : "realistic ecommerce mockup of a white hoodie worn by a model, front view, studio lighting, natural fabric folds, the uploaded design printed centered on the chest, premium streetwear product photo";

  const output: any = await replicate.run("black-forest-labs/flux-dev", {
    input: {
      prompt,
      image: product.design_image_url,
      num_outputs: 1,
      aspect_ratio: "4:5",
      output_format: "png",
    },
  });

  const aiMockupUrl = Array.isArray(output) ? output[0] : output;

  await supabase
    .from("user_products")
    .update({
      ai_mockup_url: aiMockupUrl,
    })
    .eq("id", params.id);

  redirect(`/preview/${params.id}`);
}