import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * [SEC-04b] Route API pour l'authentification enseignant.
 *
 * Implémentation simplifiée et stable (alternative à NextAuth v5 beta).
 * Utilise Supabase Auth directement via @supabase/ssr :
 *   - POST /api/auth/login → signInWithPassword
 *   - POST /api/auth/signup → signUp
 *   - POST /api/auth/logout → signOut
 *   - GET  /api/auth/session → getSession
 *
 * Avantages vs NextAuth v5 beta :
 *   - Pas de dépendance beta instable (RSK-2 mitigé)
 *   - API Supabase Auth plus simple que configuration NextAuth
 *   - Moins de code, moins de surface d'attaque
 *   - Cookies gérés par @supabase/ssr (httpOnly, secure, sameSite=lax)
 *
 * Inconvénients :
 *   - Pas de providers OAuth multiples (Google, GitHub, etc.) — non requis pour P1
 *   - Pas de gestion de session JWT stateless — mais Supabase gère les refresh tokens
 *
 * Action : GET  → renvoie la session actuelle
 * Action : POST → login/signup/logout selon le champ `action` du body
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Récupérer le profil depuis la table profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: profile?.full_name,
        department: profile?.department,
        role: profile?.role ?? "teacher",
      },
    });
  } catch (err) {
    console.error("[/api/auth/session] Erreur:", err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const supabase = await createSupabaseServerClient();

    if (action === "login") {
      // --- LOGIN ---
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email et mot de passe requis." },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.warn(`[/api/auth/login] Échec login pour ${email}: ${error.message}`);
        return NextResponse.json(
          { error: "Email ou mot de passe incorrect." },
          { status: 401 }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      return NextResponse.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: profile?.full_name,
          department: profile?.department,
          role: profile?.role ?? "teacher",
        },
      });
    }

    if (action === "signup") {
      // --- SIGNUP (voie 3 — migration douce) ---
      const { email, password, fullName, department } = body;
      if (!email || !password || !fullName) {
        return NextResponse.json(
          { error: "Email, mot de passe et nom complet requis." },
          { status: 400 }
        );
      }
      // Validation password strength (min 8 char)
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Le mot de passe doit contenir au moins 8 caractères." },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            department: department ?? null,
          },
        },
      });

      if (error) {
        console.warn(`[/api/auth/signup] Échec signup pour ${email}: ${error.message}`);
        return NextResponse.json(
          { error: "Inscription impossible. Email peut-être déjà utilisé." },
          { status: 400 }
        );
      }

      // La création du profil `profiles` est gérée par un trigger Supabase
      // (auto-création à l'inscription) — à configurer dans le dashboard Supabase.

      return NextResponse.json({
        user: {
          id: data.user?.id,
          email: data.user?.email,
          fullName,
          department,
          role: "teacher",
        },
        message: "Compte créé. Vérifiez votre email pour confirmer l'inscription.",
      });
    }

    if (action === "logout") {
      // --- LOGOUT ---
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[/api/auth/logout] Erreur:", error.message);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: `Action inconnue: ${action}. Actions valides: login, signup, logout.` },
      { status: 400 }
    );
  } catch (err) {
    console.error("[/api/auth] Erreur interne:", err);
    return NextResponse.json(
      { error: "Erreur interne d'authentification." },
      { status: 500 }
    );
  }
}
