import { NextRequest } from "next/server";
import { handleAiChat } from "@/lib/ai-proxy";

// Route historique /api/mistral — conservée pour compatibilité.
// Délègue au proxy multi-fournisseurs avec le fournisseur Mistral forcé.
// Ancien contrat conservé : { messages, apiKey?, model? }.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  return handleAiChat({ ...body, providerId: "mistral" });
}
