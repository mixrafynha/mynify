import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64.trim() : "";

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: "Image URL ou imageBase64 obrigatória" },
        { status: 400 },
      );
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "REMOVE_BG_API_KEY obrigatória" },
        { status: 500 },
      );
    }

    const formData = new FormData();

    if (imageBase64) {
      const normalizedBase64 = imageBase64.includes(",")
        ? imageBase64.split(",").pop() || ""
        : imageBase64;

      const imageBuffer = Buffer.from(normalizedBase64, "base64");

      if (!imageBuffer.length) {
        return NextResponse.json(
          { error: "imageBase64 inválida" },
          { status: 400 },
        );
      }

      formData.append(
        "image_file",
        new Blob([new Uint8Array(imageBuffer)], { type: "image/png" }),
        "image.png",
      );
    } else {
      formData.append("image_url", imageUrl);
    }

    formData.append("size", "auto");
    formData.append("format", "png");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();

      return NextResponse.json(
        {
          error: "Erro remove.bg",
          details: text,
        },
        { status: response.status },
      );
    }

    const inputBuffer = Buffer.from(await response.arrayBuffer());

    if (!inputBuffer.length) {
      return NextResponse.json(
        { error: "remove.bg devolveu imagem vazia" },
        { status: 500 },
      );
    }

    const trimmedBuffer = await sharp(inputBuffer)
      .trim({
        background: {
          r: 0,
          g: 0,
          b: 0,
          alpha: 0,
        },
        threshold: 5,
      })
      .png()
      .toBuffer();

    return new Response(new Uint8Array(trimmedBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("REMOVE BACKGROUND ERROR:", {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
    });

    return NextResponse.json(
      {
        error: "Erro interno",
        details: err?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
