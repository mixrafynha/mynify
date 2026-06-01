import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const imageUrl = body?.imageUrl;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        {
          error: "Image URL obrigatória",
        },
        { status: 400 }
      );
    }

    // Verifica API key
    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      console.error("REMOVE_BG_API_KEY missing");

      return NextResponse.json(
        {
          error: "REMOVE_BG_API_KEY não configurada",
        },
        { status: 500 }
      );
    }

    const formData = new FormData();

    formData.append("image_url", imageUrl);
    formData.append("size", "auto");

    // timeout para evitar request travado
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    const response = await fetch(
      "https://api.remove.bg/v1.0/removebg",
      {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
        },
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    console.log("REMOVE_BG_STATUS:", response.status);

    // erro vindo da remove.bg
    if (!response.ok) {
      const details = await response.text();

      console.error("REMOVE_BG_ERROR:", details);

      return NextResponse.json(
        {
          error: "Erro remove.bg",
          status: response.status,
          details,
        },
        {
          // mantém o status real (402, 401, etc)
          status: response.status,
        }
      );
    }

    const inputBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    // remove espaço transparente vazio
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
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: any) {
    console.error("REMOVE BG INTERNAL ERROR:", err);

    // timeout
    if (err?.name === "AbortError") {
      return NextResponse.json(
        {
          error: "Timeout remove.bg",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno",
        details: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
