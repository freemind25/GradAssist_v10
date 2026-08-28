import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model = "mistral-small-latest", apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API Mistral manquante. Veuillez la configurer dans Paramètres." },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Aucun message fourni." },
        { status: 400 }
      );
    }

    const client = new Mistral({ apiKey });

    const response = await client.chat.complete({
      model,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    });

    const content = response.choices?.[0]?.message?.content || "Pas de réponse.";

    return NextResponse.json({ content });
  } catch (error: unknown) {
    console.error("Mistral API error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur Mistral AI: ${message}` },
      { status: 500 }
    );
  }
}
