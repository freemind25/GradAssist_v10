import { NextRequest } from "next/server";
import { handleAiChat } from "@/lib/ai-proxy";

// Proxy IA multi-fournisseurs (BYOK) :
// le client envoie { messages, providerId, apiKey, model? } et le serveur
// relaie vers le fournisseur choisi (URL résolue côté serveur uniquement).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  return handleAiChat(body);
}
