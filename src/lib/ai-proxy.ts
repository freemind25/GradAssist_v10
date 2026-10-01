import { NextResponse } from "next/server";
import { AI_PROVIDERS, getAiProvider } from "@/lib/ai-providers";

// [SEC-01] Approche BYOK (Bring Your Own Key) multi-fournisseurs :
// - L'enseignant choisit un fournisseur dans la liste et colle SA clé API
// - La clé transite dans le body (HTTPS), n'est jamais loggée ni stockée serveur
// - L'URL du fournisseur est TOUJOURS résolue côté serveur depuis le registre
//   (jamais acceptée du client) → pas de rebond SSRF vers une URL arbitraire
// - Le modèle est accepté du client mais nettoyé (whitelist de caractères)

const MAX_MESSAGES = 100;         // [SEC-10] Limite anti-abus
// Le prompt système embarque tout le contexte du module (étudiants, présences,
// canevas…) : il dépasse couramment 10 000 caractères → limite haute requise.
const MAX_CONTENT = 200_000;

interface AiChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AiChatRequestBody {
  messages: AiChatMessage[];
  providerId?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
}

function isValidBody(body: unknown): body is AiChatRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages) || b.messages.length === 0) return false;
  if (b.messages.length > MAX_MESSAGES) return false;
  for (const msg of b.messages) {
    if (!msg || typeof msg !== "object") return false;
    const m = msg as Record<string, unknown>;
    if (!["user", "assistant", "system"].includes(m.role as string)) return false;
    if (typeof m.content !== "string" || m.content.length > MAX_CONTENT) return false;
  }
  if (b.providerId != null && typeof b.providerId !== "string") return false;
  if (b.apiKey !== undefined && typeof b.apiKey !== "string") return false;
  if (b.model !== undefined && typeof b.model !== "string") return false;
  return true;
}

/** Whitelist stricte pour l'identifiant de modèle transmis par le client */
function sanitizeModel(model: string): string | null {
  const cleaned = model.trim();
  if (!cleaned || cleaned.length > 100) return null;
  return /^[A-Za-z0-9._\/:-]+$/.test(cleaned) ? cleaned : null;
}

export async function handleAiChat(body: unknown) {
  try {
    if (!isValidBody(body)) {
      return NextResponse.json(
        { error: "Requête invalide : messages manquants ou malformés." },
        { status: 400 }
      );
    }

    const provider = getAiProvider(body.providerId);
    const apiKey = body.apiKey?.trim();

    if (!apiKey || apiKey.length < 8) {
      return NextResponse.json(
        {
          error: `Clé API manquante ou invalide. Choisissez un fournisseur et collez votre clé dans ⚙️ Informations Générales → Assistant IA (${provider.name}).`,
        },
        { status: 401 }
      );
    }

    const model =
      (body.model ? sanitizeModel(body.model) : null) ?? provider.defaultModel;

    const payload = {
      model,
      messages: body.messages,
      temperature:
        typeof body.temperature === "number" &&
        body.temperature >= 0 &&
        body.temperature <= 2
          ? body.temperature
          : 0.2,
    };

    const callUpstream = () =>
      fetch(provider.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

    let res = await callUpstream();

    // [RESILIENCE] Les routeurs gratuits (ex. RoutesMe) renvoient parfois des
    // 502/503/504 transitoires : une seule relance après courte pause.
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      res = await callUpstream();
    }

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const err = await res.json();
        detail = err?.error?.message || err?.message || detail;
      } catch {
        // Réponse non-JSON
      }
      console.error(
        `[/api/ai] ${provider.name} ${res.status}: ${detail.slice(0, 200)}`
      );

      let userMessage = `Erreur du service IA (${provider.name}).`;
      if (res.status === 401 || res.status === 403) {
        userMessage = `Clé API ${provider.name} non valide ou non autorisée. Vérifiez votre clé dans ⚙️ Informations Générales.`;
      } else if (res.status === 404) {
        userMessage = `Modèle « ${model} » introuvable chez ${provider.name}. Vérifiez le nom du modèle.`;
      } else if (res.status === 429) {
        userMessage = `Quota ${provider.name} atteint (trop de requêtes). Patientez quelques instants ou changez de fournisseur.`;
      } else if (res.status === 402) {
        userMessage = `Crédit insuffisant sur ${provider.name}. Utilisez un fournisseur gratuit (RoutesMe, Groq, Gemini) ou rechargez votre compte.`;
      } else if (res.status >= 500) {
        userMessage = "Le service IA est temporairement indisponible. Réessayez dans quelques secondes.";
      }
      return NextResponse.json({ error: userMessage }, { status: res.status });
    }

    const data = await res.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      "⚠️ Pas de réponse de l'IA (format inattendu).";

    return NextResponse.json({ content, provider: provider.id, model });
  } catch (err) {
    console.error("[/api/ai] Erreur interne:", err);
    return NextResponse.json({ error: "Erreur interne du proxy IA." }, { status: 500 });
  }
}

// Utilisé par /api/mistral pour rester compatible avec les anciens clients
export const LEGACY_MISTRAL_PROVIDER_ID = AI_PROVIDERS.find(
  (p) => p.id === "mistral"
)?.id;
