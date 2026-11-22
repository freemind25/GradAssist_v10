import { NextRequest } from "next/server";
import { handleAiChat } from "@/lib/ai-proxy";
import { enforceApiGuard } from "@/lib/api-guard";

// Proxy IA multi-fournisseurs (BYOK) :
// le client envoie { messages, providerId, apiKey, model? } et le serveur
// relaie vers le fournisseur choisi (URL résolue côté serveur uniquement).
//
// La route est publique par nécessité (mode invité), mais protégée contre
// l'usage comme relais : origine contrôlée, quota par IP, taille bornée.
// Pour exiger une session, définir REQUIRE_AUTH_FOR_AI=1.
export async function POST(req: NextRequest) {
  const blocked = enforceApiGuard(req, {
    route: "ai",
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  return handleAiChat(body);
}
