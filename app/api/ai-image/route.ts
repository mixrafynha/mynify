// app/api/ai-image/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // Apenas um placeholder para simular a resposta
  const placeholderImage = "https://picsum.photos/512/512";

  console.log("Simulando AI image para prompt:", prompt);

  return NextResponse.json({ image: placeholderImage });
}