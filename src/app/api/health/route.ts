import { NextResponse } from "next/server";

/**
 * [OPS] Health check public — utilisé par uptime monitoring + runbook.
 *
 * GET /api/health
 * Réponse 200 : service opérationnel
 * Réponse 503 : service dégradé (DB indisponible, etc.)
 */

export async function GET() {
  const startTime = Date.now();

  try {
    // Vérifications de santé basiques
    const checks: Record<string, boolean> = {
      app: true,
      timestamp: true,
    };

    // Vérifier les variables d'environnement critiques
    const envOk = !!(
      process.env.NEXTAUTH_SECRET ||
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    checks.envConfigured = envOk;

    // (post-P2) Vérifier connexion DB Neon
    // const supabase = await createSupabaseServerClient();
    // const { error } = await supabase.from('profiles').select('count').limit(1);
    // checks.database = !error;

    const uptime = process.uptime();
    const responseTimeMs = Date.now() - startTime;

    const allHealthy = Object.values(checks).every(Boolean);

    return NextResponse.json(
      {
        status: allHealthy ? "ok" : "degraded",
        version: process.env.npm_package_version || "2.8.0",
        uptime: Math.round(uptime),
        responseTimeMs,
        checks,
        timestamp: new Date().toISOString(),
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
