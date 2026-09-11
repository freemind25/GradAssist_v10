import { NextRequest, NextResponse } from "next/server";

// [SEC-01] Approche hybride (exigence utilisateur) :
// - Chaque enseignant PEUT utiliser sa propre clé API Mistral (saisie dans Paramètres)
// - La clé est envoyée dans le body de la requête (over HTTPS, jamais en clair dans l'URL)
// - Si l'enseignant n'a pas configuré sa clé, on utilise la clé serveur (MISTRAL_API_KEY env var)
// - La clé serveur est un fallback pour les utilisateurs qui ne veulent pas créer de compte Mistral

const MISTRAL_BASE = "https://api.mistral.ai/v1/chat/completions";
const DEFAULT_MODEL = process.env.MISTRAL_MODEL || "open-mistral-7b";

interface MistralMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface MistralRequestBody {
  messages: MistralMessage[];
  apiKey?: string;      // Clé utilisateur (optionnelle)
  model?: string;
  temperature?: number;
}

function isValidBody(body: unknown): body is MistralRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages) || b.messages.length === 0) return false;
  if (b.messages.length > 50) return false; // [SEC-10] Limite anti-abus
  for (const msg of b.messages) {
    if (!msg || typeof msg !== "object") return false;
    const m = msg as Record<string, unknown>;
    if (!["user", "assistant", "system"].includes(m.role as string)) return false;
    if (typeof m.content !== "string" || m.content.length > 8000) return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!isValidBody(body)) {
      return NextResponse.json(
        { error: "Requête invalide : messages manquants ou malformés." },
        { status: 400 }
      );
    }

    // [SEC-01] Clé API : priorité à la clé utilisateur, fallback sur clé serveur
    const userApiKey = body.apiKey;
    const serverApiKey = process.env.MISTRAL_API_KEY;
    const mistralApiKey = userApiKey || serverApiKey;

    if (!mistralApiKey) {
      // Ni clé utilisateur, ni clé serveur → erreur explicite
      return NextResponse.json(
        {
          error: "Clé API Mistral manquante. Configurez-la dans ⚙️ Informations Générales ou demandez à l'administrateur de configurer MISTRAL_API_KEY côté serveur.",
        },
        { status: 401 }
      );
    }

    // Validation du format de la clé (préfixe Mistral)
    if (typeof mistralApiKey !== "string" || mistralApiKey.trim().length < 10) {
      return NextResponse.json(
        { error: "Format de clé API Mistral invalide." },
        { status: 401 }
      );
    }

    const payload = {
      model: DEFAULT_MODEL,
      messages: body.messages,
      temperature: typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 2
        ? body.temperature
        : 0.2,
    };

    const res = await fetch(MISTRAL_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const err = await res.json();
        detail = err?.error?.message || err?.message || detail;
      } catch {
        // Réponse non-JSON
      }
      console.error(`[/api/mistral] Mistral API ${res.status}: ${detail}`);
      // Ne pas exposer les détails de l'erreur Mistral au client
      let userMessage = "Erreur du service IA.";
      if (res.status === 401 || res.status === 403) {
        userMessage = "Clé API Mistral non valide ou non autorisée. Vérifiez votre clé dans ⚙️ Informations Générales.";
      } else if (res.status === 429) {
        userMessage = "Trop de requêtes vers le service IA. Patientez quelques secondes.";
      } else if (res.status === 502 || res.status === 503 || res.status === 504) {
        userMessage = "Le service IA est temporairement indisponible. Réessayez dans quelques secondes.";
      }
      return NextResponse.json(
        { error: userMessage },
        { status: res.status }
      );
    }

    const data = await res.json();
    const content =
      data?.choices?.[0]?.message?.content ||
      "⚠️ Pas de réponse de l'IA (format inattendu).";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("[/api/mistral] Erreur interne:", err);
    return NextResponse.json(
      { error: "Erreur interne du proxy IA." },
      { status: 500 }
    );
  }
}
