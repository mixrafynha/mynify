// app/api/ai-image/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt obrigatório" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://cloud.leonardo.ai/api/rest/v1/generations",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
        },
        body: JSON.stringify({
          modelId: "b2614463-296c-462a-9586-aafdb8f00e36",
          prompt,
          num_images: 1,
          width: 1024,
          height: 1024,
          enhancePrompt: false,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro Leonardo API", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      generationId: data.sdGenerationJob?.generationId,
      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao gerar imagem" },
      { status: 500 }
    );
  }
}
