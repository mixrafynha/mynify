import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { uploadR2Object } from "../../../trigger/shared/r2";

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
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {}
        },
      },
    }
  );
}

export async function POST(
  req: Request
) {
  let supabase:
    | Awaited<
        ReturnType<
          typeof getSupabase
        >
      >
    | null = null;

  let creditConsumed = false;

  async function refundCredit() {
    if (
      !supabase ||
      !creditConsumed
    )
      return;

    await supabase.rpc(
      "refund_ai_credit"
    );

    creditConsumed = false;
  }

  try {
    supabase =
      await getSupabase();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    // guest
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Create a free account and get 3 AI credits.",
        },
        {
          status: 401,
        }
      );
    }

    // consumir crédito
    const {
      data: consumed,
      error: creditError,
    } = await supabase.rpc(
      "consume_ai_credit"
    );

    if (creditError) {
      return NextResponse.json(
        {
          error:
            "Error checking credits",
          details:
            creditError.message,
        },
        {
          status: 500,
        }
      );
    }

    // sem créditos
    if (!consumed) {
      return NextResponse.json(
        {
          error:
            "You have 0 AI credits left.",
        },
        {
          status: 402,
        }
      );
    }

    creditConsumed = true;

    const body =
      await req.json();

    const prompt =
      body?.prompt;

    if (
      !prompt ||
      typeof prompt !==
        "string"
    ) {
      await refundCredit();

      return NextResponse.json(
        {
          error:
            "Prompt required",
        },
        {
          status: 400,
        }
      );
    }

    // criar geração
    const createResponse =
      await fetch(
        "https://cloud.leonardo.ai/api/rest/v1/generations",
        {
          method: "POST",

          headers: {
            accept:
              "application/json",

            "content-type":
              "application/json",

            authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
          },

          body: JSON.stringify(
            {
              modelId:
                "b2614463-296c-462a-9586-aafdb8f00e36",

              prompt,

              num_images: 1,

              width: 1536,
              height: 1536,

              enhancePrompt: true,
            }
          ),
        }
      );

    const createData =
      await createResponse.json();

    console.log(
      "CREATE DATA:",
      createData
    );

    if (!createResponse.ok) {
      await refundCredit();

      return NextResponse.json(
        {
          error:
            "Leonardo API error",
          details:
            createData,
        },
        {
          status:
            createResponse.status,
        }
      );
    }

    const generationId =
      createData
        ?.sdGenerationJob
        ?.generationId;

    if (!generationId) {
      await refundCredit();

      return NextResponse.json(
        {
          error:
            "Generation ID not found",
          details:
            createData,
        },
        {
          status: 500,
        }
      );
    }

    // polling
    for (
      let i = 0;
      i < 40;
      i++
    ) {
      await sleep(1800);

      const getResponse =
        await fetch(
          `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
          {
            method: "GET",

            headers: {
              accept:
                "application/json",

              authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
            },
          }
        );

      const getData =
        await getResponse.json();

      console.log(
        "GET DATA:",
        getData
      );

      if (!getResponse.ok) {
        await refundCredit();

        return NextResponse.json(
          {
            error:
              "Error fetching image",
            details:
              getData,
          },
          {
            status:
              getResponse.status,
          }
        );
      }

      const imageUrl =
        getData
          ?.generations_by_pk
          ?.generated_images?.[0]
          ?.url;

      if (imageUrl) {
        const baseUrl =
          process.env
            .NEXT_PUBLIC_APP_URL
            ? process.env
                .NEXT_PUBLIC_APP_URL
            : process.env
                .VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "http://localhost:3000";

        // remove background
        const removeBgResponse =
          await fetch(
            `${baseUrl}/api/remove-background`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  imageUrl,
                }
              ),
            }
          );

        if (
          !removeBgResponse.ok
        ) {
          await refundCredit();

          const details =
            await removeBgResponse.text();

          return NextResponse.json(
            {
              error:
                "Image generated but remove background failed",

              originalImageUrl:
                imageUrl,

              details,
            },
            {
              status: 500,
            }
          );
        }

        const arrayBuffer =
          await removeBgResponse.arrayBuffer();

        const pngBuffer =
          Buffer.from(
            arrayBuffer
          );

        const objectKey = [
          "ai-images",
          user.id,
          `${generationId}-${Date.now()}.png`,
        ].join("/");

        let publicImageUrl: string;

        try {
          publicImageUrl =
            await uploadR2Object({
              key: objectKey,
              body: pngBuffer,
              contentType: "image/png",
              cacheControl:
                "public, max-age=31536000, immutable",
            });
        } catch (uploadError: any) {
          await refundCredit();

          console.error(
            "AI IMAGE R2 UPLOAD ERROR:",
            uploadError
          );

          return NextResponse.json(
            {
              error:
                "Image generated but R2 upload failed",

              originalImageUrl:
                imageUrl,

              details:
                uploadError?.message ||
                "Unknown R2 upload error",
            },
            {
              status: 500,
            }
          );
        }

        return NextResponse.json(
          {
            success: true,

            imageUrl:
              publicImageUrl,

            src:
              publicImageUrl,

            url:
              publicImageUrl,

            image:
              publicImageUrl,

            r2Key:
              objectKey,

            originalImageUrl:
              imageUrl,

            generationId,
          }
        );
      }
    }

    await refundCredit();

    return NextResponse.json(
      {
        error:
          "Generation timeout",
        generationId,
      },
      {
        status: 504,
      }
    );
  } catch (error: any) {
    await refundCredit();

    console.error(
      "AI IMAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Internal AI image error",

        details:
          error?.message ||
          "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}