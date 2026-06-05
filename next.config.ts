import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── Sécurité build ──────────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,   // Erreurs TS bloquent le build en prod
  },
  eslint: {
    ignoreDuringBuilds: false,  // ESLint actif en CI
  },

  // ── Docker standalone ───────────────────────────────────────────────
  output: 'standalone',

  // ── Images ──────────────────────────────────────────────────────────
  images: {
    dangerouslyAllowSVG: false, // Sécurité : SVG distants désactivés
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // ── Dev indicators ──────────────────────────────────────────────────
  devIndicators: {
    buildActivity: false,
  },

  // ── Origines dev autorisées (Firebase Studio) ───────────────────────
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1746986812400.cluster-ombtxv25tbd6yrjpp3lukp6zhc.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
