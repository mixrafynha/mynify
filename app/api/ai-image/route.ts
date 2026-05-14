// app/api/ai-image/route.ts

import { NextResponse } from "next/server";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = body?.prompt;
    const transparent = body?.transparent ?? true;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt obrigatório" },
        { status: 400 }
      );
    }

    // CREATE GENERATION
    const createResponse = await fetch(
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

          transparent_background: transparent,
        }),
      }
    );

    const createData = await createResponse.json();

    console.log("CREATE DATA:", createData);

    if (!createResponse.ok) {
      return NextResponse.json(
        {
          error: "Erro Leonardo API",
          details: createData,
        },
        {
          status: createResponse.status,
        }
      );
    }

    const generationId =
      createData?.sdGenerationJob?.generationId;

    if (!generationId) {
      return NextResponse.json(
        {
          error: "Generation ID não encontrado",
          details: createData,
        },
        {
          status: 500,
        }
      );
    }

    let imageUrl: string | null = null;

    // WAIT FOR IMAGE
    for (let i = 0; i < 30; i++) {
      await sleep(1500);

      const getResponse = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
          },
        }
      );

      const getData = await getResponse.json();

      console.log("GET DATA:", getData);

      if (!getResponse.ok) {
        return NextResponse.json(
          {
            error: "Erro ao buscar imagem",
            details: getData,
          },
          {
            status: getResponse.status,
          }
        );
      }

      imageUrl =
        getData?.generations_by_pk?.generated_images?.[0]?.url;

      if (imageUrl) {
        return NextResponse.json({
          success: true,
          imageUrl,
          generationId,
        });
      }
    }

    return NextResponse.json(
      {
        error: "Tempo excedido ao gerar imagem",
        generationId,
      },
      {
        status: 504,
      }
    );
  } catch (error: any) {
    console.error("AI IMAGE ERROR:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao gerar imagem",
        details: error?.message || "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
