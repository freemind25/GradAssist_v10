
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow Data URLs for image previews (e.g., uploaded logos)
    dangerouslyAllowSVG: true, 
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: [], // Keep empty if not using external domains other than remotePatterns
    loader: 'default', // or 'imgix', 'cloudinary', 'akamai', 'custom'
    path: '/_next/image',
    unoptimized: false, // Set to true if you don't want optimization, e.g. for SVGs or animated GIFs
  },
   devIndicators: {
    buildActivity: false,
  },
  experimental: {
    allowedDevOrigins: [
        "https://6000-firebase-studio-1746986812400.cluster-ombtxv25tbd6yrjpp3lukp6zhc.cloudworkstations.dev"
    ]
  }
};

export default nextConfig;
