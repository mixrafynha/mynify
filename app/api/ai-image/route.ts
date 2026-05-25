import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    }
  );
}

export async function POST(req: Request) {
  let supabase: Awaited<ReturnType<typeof getSupabase>> | null = null;
  let creditConsumed = false;

  async function refundCredit() {
    if (!supabase || !creditConsumed) return;

    await supabase.rpc("refund_ai_credit");
    creditConsumed = false;
  }

  try {
    supabase = await getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Precisas criar conta para gerar designs." },
        { status: 401 }
      );
    }

    const { data: consumed, error: creditError } =
      await supabase.rpc("consume_ai_credit");

    if (creditError) {
      return NextResponse.json(
        { error: "Erro ao verificar créditos", details: creditError.message },
        { status: 500 }
      );
    }

    if (!consumed) {
      return NextResponse.json(
        { error: "Sem créditos disponíveis. Compra mais créditos para continuar." },
        { status: 402 }
      );
    }

    creditConsumed = true;

    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      await refundCredit();

      return NextResponse.json(
        { error: "Prompt obrigatório" },
        { status: 400 }
      );
    }

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
          width: 1536,
          height: 1536,
          enhancePrompt: true,
        }),
      }
    );

    const createData = await createResponse.json();
    console.log("CREATE DATA:", createData);

    if (!createResponse.ok) {
      await refundCredit();

      return NextResponse.json(
        { error: "Erro Leonardo API", details: createData },
        { status: createResponse.status }
      );
    }

    const generationId = createData?.sdGenerationJob?.generationId;

    if (!generationId) {
      await refundCredit();

      return NextResponse.json(
        { error: "Generation ID não encontrado", details: createData },
        { status: 500 }
      );
    }

    for (let i = 0; i < 40; i++) {
      await sleep(1800);

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
        await refundCredit();

        return NextResponse.json(
          { error: "Erro ao buscar imagem", details: getData },
          { status: getResponse.status }
        );
      }

      const imageUrl =
        getData?.generations_by_pk?.generated_images?.[0]?.url;

      if (imageUrl) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL
          ? process.env.NEXT_PUBLIC_APP_URL
          : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000";

        const removeBgResponse = await fetch(
          `${baseUrl}/api/remove-background`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl }),
          }
        );

        if (!removeBgResponse.ok) {
          await refundCredit();

          const details = await removeBgResponse.text();

          return NextResponse.json(
            {
              error: "Imagem gerada, mas falhou ao remover fundo",
              originalImageUrl: imageUrl,
              details,
            },
            { status: 500 }
          );
        }

        const arrayBuffer = await removeBgResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        return NextResponse.json({
          success: true,
          imageUrl: `data:image/png;base64,${base64}`,
          originalImageUrl: imageUrl,
          generationId,
        });
      }
    }

    await refundCredit();

    return NextResponse.json(
      { error: "Tempo excedido ao gerar imagem", generationId },
      { status: 504 }
    );
  } catch (error: any) {
    await refundCredit();

    console.error("AI IMAGE ERROR:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao gerar imagem",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
