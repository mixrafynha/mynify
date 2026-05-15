import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const imageUrl = body?.imageUrl;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL obrigatória" },
        { status: 400 }
      );
    }

    const formData = new FormData();

    formData.append("image_url", imageUrl);
    formData.append("size", "auto");

    const response = await fetch(
      "https://api.remove.bg/v1.0/removebg",
      {
        method: "POST",
        headers: {
          "X-Api-Key": process.env.REMOVE_BG_API_KEY!,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const text = await response.text();

      return NextResponse.json(
        {
          error: "Erro remove.bg",
          details: text,
        },
        { status: response.status }
      );
    }

    const inputBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    // REMOVE EMPTY TRANSPARENT SPACE
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

    return new Response(
      new Uint8Array(trimmedBuffer),
      {
        headers: {
          "Content-Type": "image/png",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Erro interno",
        details: err?.message,
      },
      { status: 500 }
    );
  }
}
