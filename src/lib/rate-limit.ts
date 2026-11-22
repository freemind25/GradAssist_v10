/**
 * Limitation de débit simple, en mémoire.
 *
 * Objectif : empêcher qu'un tiers utilise les routes publiques de GradeAssist
 * comme relais (notamment `/api/ai`) ou tente une attaque par force brute sur
 * `/api/auth`.
 *
 * Limite connue : le compteur vit dans l'instance du serveur. Sur Vercel, une
 * fonction serverless peut être instanciée plusieurs fois en parallèle, donc la
 * limite effective est « par instance » et non globale. C'est suffisant pour
 * arrêter un abus naïf ; pour une garantie stricte, brancher Upstash Redis
 * (variables déjà prévues dans `.env.example`).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

/** Nombre maximum de compteurs conservés avant réinitialisation. */
const MAX_BUCKETS = 5_000;

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Secondes à attendre avant de réessayer (0 si la requête passe). */
  retryAfterSec: number;
}

/**
 * Consomme une unité du quota `key`.
 *
 * @param key      identifiant du quota (route + IP, éventuellement e-mail)
 * @param limit    nombre de requêtes autorisées par fenêtre
 * @param windowMs durée de la fenêtre, en millisecondes
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_BUCKETS) {
      // Protection mémoire : on repart d'une table vide plutôt que de croître
      // indéfiniment. Le pire effet est un relâchement ponctuel des quotas.
      buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}
