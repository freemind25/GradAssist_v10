import { NextRequest } from "next/server";
import { handleAiChat } from "@/lib/ai-proxy";
import { enforceApiGuard } from "@/lib/api-guard";

// Route historique /api/mistral — conservée pour compatibilité.
// Délègue au proxy multi-fournisseurs avec le fournisseur Mistral forcé.
// Ancien contrat conservé : { messages, apiKey?, model? }.
//
// Même quota que /api/ai : les deux routes partagent la clé « ai », donc
// changer d'endpoint ne permet pas de contourner la limitation de débit.
export async function POST(req: NextRequest) {
  const blocked = enforceApiGuard(req, {
    route: "ai",
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (blocked) return blocked;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  return handleAiChat({ ...body, providerId: "mistral" });
}
