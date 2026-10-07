// Registre des fournisseurs IA supportés par l'assistant GradeAssist.
// Tous exposent une API "chat/completions" compatible OpenAI (Bearer key).
// La clé de l'utilisateur reste côté client (localStorage) et est envoyée
// au proxy /api/ai qui l'utilise uniquement côté serveur.

export interface AiProvider {
  id: string;
  name: string;
  /** URL complète du endpoint chat/completions (jamais acceptée du client) */
  baseUrl: string;
  /** Page où obtenir une clé API */
  docsUrl: string;
  /** Modèle utilisé si l'utilisateur n'en choisit pas un */
  defaultModel: string;
  /** Badge affiché dans la liste (ex. "Gratuit") */
  freeBadge?: string;
  description: string;
}

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: "routesme",
    name: "RoutesMe",
    baseUrl: "https://routesme.online/v1/chat/completions",
    docsUrl: "https://routesme.online/",
    defaultModel: "LING-3.0-Flash",
    freeBadge: "Gratuit",
    description:
      "Routeur multi-modèles avec quota gratuit quotidien (API compatible OpenAI). Recommandé : clé gratuite sur routesme.online.",
  },
  {
    id: "groq",
    name: "Groq Cloud",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    docsUrl: "https://console.groq.com/keys",
    defaultModel: "llama-3.1-8b-instant",
    freeBadge: "Gratuit",
    description:
      "Inférence ultra-rapide sur des modèles open source, avec un niveau gratuit généreux.",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    docsUrl: "https://openrouter.ai/keys",
    defaultModel: "openrouter/auto",
    description:
      "Une seule clé pour des centaines de modèles, dont plusieurs gratuits (suffixe :free).",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    baseUrl:
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    docsUrl: "https://aistudio.google.com/apikey",
    defaultModel: "gemini-2.0-flash",
    freeBadge: "Gratuit",
    description:
      "Endpoint compatible OpenAI de Google AI Studio, avec quota gratuit.",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    docsUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o-mini",
    description: "Les modèles GPT d'OpenAI (payant, facturé à votre clé).",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    docsUrl: "https://console.mistral.ai/api-keys/",
    defaultModel: "mistral-small-latest",
    description:
      "La Plateforme Mistral (ancien tier gratuit retiré ; fonctionnel avec une clé payante).",
  },
  {
    id: "codecraft",
    name: "CodeCraft AI",
    baseUrl: "https://api.craftapi.com/v1/chat/completions",
    docsUrl: "https://www.craftapi.com/dashboard/get-started",
    defaultModel: "gpt-4o-mini",
    freeBadge: "1M tokens/mois",
    description:
      "Endpoint OpenAI-compatible (chat/completions) avec clé API personnalisée. Niveau gratuit 1M tokens/mois selon votre offre.",
  },
];

export const DEFAULT_AI_PROVIDER_ID = AI_PROVIDERS[0].id;

// Quand un utilisateur n'a pas choisi de fournisseur mais qu'une clé est déjà
// enregistrée pour un fournisseur donné, on retombe sur ce fournisseur (et non
// systématiquement sur RoutesMe), pour éviter d'envoyer providerId: null à /api/ai.
export function getDefaultProviderIdWithKey(
  savedProviderId: string | null | undefined,
  savedApiKey: string | null | undefined,
): string {
  if (savedProviderId && savedApiKey && savedApiKey.length >= 8) {
    return savedProviderId;
  }
  return DEFAULT_AI_PROVIDER_ID;
}

export function getAiProvider(id: string | undefined | null): AiProvider {
  return (
    AI_PROVIDERS.find((p) => p.id === id) ?? AI_PROVIDERS[0]
  );
}

/** Clés localStorage (nouveau schéma multi-fournisseurs) */
export const AI_STORAGE_KEYS = {
  apiKey: "gradeAssist_aiApiKey",
  provider: "gradeAssist_aiProvider",
  model: "gradeAssist_aiModel",
} as const;

/** Ancienne clé Mistral (compatibilité avec les versions précédentes) */
export const LEGACY_MISTRAL_KEY = "gradeAssist_mistralApiKey";
