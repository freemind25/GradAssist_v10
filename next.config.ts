import type { NextConfig } from 'next';

// [SEC-05] Désactivé : un SVG peut contenir du JS inline exécutable dans le contexte
// de l'app. Les logos universitaires doivent être convertis en PNG côté client avant
// upload, ou stockés en base64 PNG.
// [SEC-06] ESLint désormais bloquant en build de production (règles de sécurité incluses).
// [SEC-09] En-têtes de sécurité HTTP gérés dans middleware.ts (CSP avec nonce dynamique).
// Le middleware est obligatoire car la CSP nécessite un nonce régénéré à chaque requête.

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // [SEC-06] ESLint doit bloquer le build de production
    // (règles de sécurité @typescript-eslint/strict, eslint-plugin-security)
    ignoreDuringBuilds: false,
  },
  images: {
    unoptimized: true,
    // [SEC-05] SVG interdit — risque XSS via <script> inline, onload, foreignObject
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },
  // [SEC-09] Headers de sécurité définis dans middleware.ts (nonce dynamique requis).
  // La fonction headers() next.config est conservée pour fallback si middleware désactivé.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // CSP fallback (le middleware ajoute le nonce sur les pages dynamiques)
          // Google Identity Services (accounts.google.com) + Drive API + OAuth requis
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.mistral.ai https://www.googleapis.com https://oauth2.googleapis.com",
              "frame-src 'self' https://accounts.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

