import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_NAME, verifyToken, type JwtPayload } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Garde commune aux routes API exposées.
 *
 * Trois contrôles, dans cet ordre :
 *  1. **Origine** — une requête de navigateur provenant d'un autre site est
 *     refusée (403). Sans en-tête `Origin` (curl, appel serveur), le contrôle
 *     est sans objet : la limitation de débit reste la seule barrière.
 *  2. **Débit** — quota par adresse IP et par route (429 avec `Retry-After`).
 *  3. **Session** — optionnelle, ou imposée par `REQUIRE_AUTH_FOR_AI=1`.
 *
 * Note : ces routes sont hors du `matcher` du middleware, qui ne s'applique
 * qu'aux pages. Les contrôles doivent donc vivre ici.
 */

/** Domaine de production, toujours autorisé. */
const PRODUCTION_HOST = "grad-assist-v10.vercel.app";

/** Hôtes de développement local. */
const LOCAL_HOSTS = ["localhost:3000", "127.0.0.1:3000", "localhost:3001"];

export interface ApiGuardOptions {
  /** Nom de la route, utilisé dans le quota (ex. "ai"). */
  route: string;
  /** Requêtes autorisées par fenêtre. */
  limit: number;
  /** Durée de la fenêtre en millisecondes. */
  windowMs: number;
  /** Impose une session valide, en plus des secrets. */
  requireSession?: boolean;
}

/** Adresse IP du client, telle que vue par l'hébergeur. */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "inconnu"
  );
}

/** Hôtes autorisés à appeler l'API depuis un navigateur. */
function allowedHosts(req: NextRequest): Set<string> {
  const hosts = new Set<string>([PRODUCTION_HOST, ...LOCAL_HOSTS]);

  const requestHost = req.headers.get("host");
  if (requestHost) hosts.add(requestHost.toLowerCase());

  // Origines supplémentaires (préversions, domaine personnalisé…).
  for (const entry of (process.env.ALLOWED_API_ORIGINS ?? "").split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    try {
      hosts.add(new URL(trimmed).host.toLowerCase());
    } catch {
      hosts.add(trimmed.toLowerCase());
    }
  }

  return hosts;
}

/**
 * Vrai si la requête vient du site lui-même (ou d'une origine explicitement
 * autorisée). Les requêtes sans `Origin` sont acceptées : elles ne peuvent pas
 * être forgées par un navigateur.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  if (origin === "null") return false; // iframe sandbox / data:
  try {
    return allowedHosts(req).has(new URL(origin).host.toLowerCase());
  } catch {
    return false;
  }
}

/** Session décodée depuis le cookie httpOnly, ou null. */
export function getSession(req: NextRequest): JwtPayload | null {
  return verifyToken(req.cookies.get(COOKIE_NAME)?.value);
}

function isSessionRequired(options: ApiGuardOptions): boolean {
  if (options.requireSession) return true;
  // Interrupteur global : un établissement peut exiger une session pour l'IA.
  return (
    process.env.REQUIRE_AUTH_FOR_AI === "1" && options.route.startsWith("ai")
  );
}

/**
 * Applique la garde. Retourne une réponse à renvoyer si la requête est
 * refusée, ou `null` si elle peut continuer.
 */
export function enforceApiGuard(
  req: NextRequest,
  options: ApiGuardOptions
): NextResponse | null {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { error: "Origine non autorisée." },
      { status: 403 }
    );
  }

  const ip = getClientIp(req);
  const quota = rateLimit(
    `${options.route}:${ip}`,
    options.limit,
    options.windowMs
  );

  if (!quota.ok) {
    return NextResponse.json(
      {
        error:
          "Trop de requêtes. Patientez quelques minutes avant de réessayer.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(quota.retryAfterSec) },
      }
    );
  }

  if (isSessionRequired(options) && !getSession(req)) {
    return NextResponse.json(
      {
        error:
          "Session requise. Connectez-vous depuis la page de connexion pour utiliser ce service.",
      },
      { status: 401 }
    );
  }

  return null;
}
