import { NextRequest, NextResponse } from "next/server";

const MISTRAL_BASE = "https://api.mistral.ai/v1/chat/completions";
const DEFAULT_MODEL = "open-mistral-7b";

export async function POST(req: NextRequest) {
  try {
    const { messages, apiKey, model, temperature } = await req.json().catch(
      () => ({})
    );

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages invalides" },
        { status: 400 }
      );
    }

    const key =
      apiKey ||
      process.env.MISTRAL_API_KEY;

    if (!key) {
      return NextResponse.json(
        { error: "Clé API Mistral manquante. Configurez-la dans ⚙️ Informations Générales ou dans les variables d'environnement." },
        { status: 401 }
      );
    }

    const res = await fetch(MISTRAL_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages,
        temperature: typeof temperature === "number" ? temperature : 0.2,
      }),
    });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const err = await res.json();
        detail = err?.error?.message || err?.message || detail;
      } catch {
        // ignore
      }
      return NextResponse.json(
        { error: `Mistral API ${res.status}: ${detail}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const content =
      data?.choices?.[0]?.message?.content ||
      "⚠️ Pas de réponse de l'IA (format inattendu).";

    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur interne du proxy IA." },
      { status: 500 }
    );
  }
}
