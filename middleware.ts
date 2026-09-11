import { NextResponse, type NextRequest } from "next/server";

/**
 * [SEC-09] Middleware de génération de nonce CSP + garde d'authentification.
 *
 * Exécuté à chaque requête sur les routes non statiques.
 *
 * Rôles :
 * 1. Génère un nonce aléatoire (32 octets) par requête et l'injecte dans la CSP
 *    (header Content-Security-Policy). Le nonce est transmis aux Server Components
 *    via le header x-nonce, puis utilisé dans next/script pour autoriser uniquement
 *    les scripts générés par Next.js (Google Identity Services, etc.).
 *    → Aucun script injecté par un attaquant (XSS via SVG malveillant) ne peut s'exécuter.
 *
 * 2. Ajoute les en-têtes de sécurité standards (HSTS, X-Frame-Options, etc.)
 *    Définitions dans next.config.ts → headers() — mais certains en-têtes doivent
 *    être dynamiques (CSP avec nonce), d'où le middleware.
 *
 * 3. (post-P1-PR-10) Garde d'authentification — redirection vers /auth/login si non authentifié.
 *    Pour l'instant, garde d'auth minimal — auth réelle ajoutée en PR-09/PR-10.
 *
 * Référence : https://nextjs.org/docs/app/building-your-application/routing/middleware
 *             https://web.dev/articles/csp
 */

// Routes publiques (pas besoin d'authentification ni de garde spécifique)
const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/confidentialite",
  "/conditions",
  "/api/auth",        // Routes NextAuth
  "/api/health",      // Health check public
  "/api/mistral",     // Pas de garde middleware (auth dans la route elle-même)
  "/_next",           // Assets Next.js
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
  "/icon-192.svg",
  "/icon-512.svg",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Génère un nonce cryptographiquement aléatoire (32 octets → 64 char hex).
 * Utilise l'API Web Crypto (disponible dans le runtime Edge).
 */
function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Construit la chaîne CSP avec le nonce injecté.
 * Le squelette de la CSP est défini dans next.config.ts, mais le nonce doit être
 * dynamique — d'où la surcharge ici.
 */
function buildCspHeader(nonce: string): string {
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob:`,
    `connect-src 'self' https://api.mistral.ai https://www.googleapis.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];
  return csp.join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const cspHeader = buildCspHeader(nonce);

  // Cloner la requête pour injecter le nonce dans les headers
  // (transmis aux Server Components via headers())
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  // Construire la réponse
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Appliquer les en-têtes de sécurité sur la réponse
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // (post-PR-10) Garde d'authentification — à activer quand NextAuth sera en place
  // Pour l'instant, on ne bloque rien — l'auth factice de teacher-login.tsx reste.
  // Quand PR-10 sera mergée :
  //   const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  //   if (!session && !isPublic(request.nextUrl.pathname)) {
  //     const loginUrl = new URL("/auth/login", request.url);
  //     loginUrl.searchParams.set("callbackUrl", request.url);
  //     return NextResponse.redirect(loginUrl);
  //   }

  return response;
}

/**
 * Configure le matcher — exclut les fichiers statiques et les paths internes Next.js.
 */
export const config = {
  matcher: [
    /*
     * Matcher :
     * - Toutes les routes sauf celles commençant par :
     *   - api (géré séparément)
     *   - _next/static (fichiers statiques)
     *   - _next/image (optimisation d'images)
     *   - favicon.ico (icône)
     *   - les fichiers avec extension (.png, .svg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|js|css|map)$).*)",
  ],
};
