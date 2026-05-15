import { NextResponse } from "next/server";

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

    const arrayBuffer = await response.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "image/png",
      },
    });
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
