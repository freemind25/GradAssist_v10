import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getTokenFromCookies,
  COOKIE_NAME,
  getSessionCookieOptions,
  type JwtPayload,
} from "@/lib/auth";
import {
  createUser,
  getUserByEmail,
  getUserById,
  emailExists,
  initializeDatabase,
} from "@/lib/db";

/**
 * [SEC-04b/c] Route API d'authentification — Neon PostgreSQL + bcrypt + JWT.
 *
 * POST /api/auth { action: "login" | "signup" | "logout", ... }
 * GET  /api/auth → renvoie la session actuelle (depuis cookie JWT)
 *
 * Le JWT est stocké en cookie httpOnly (jamais accessible au JS client).
 */

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = getTokenFromCookies(
      cookieStore.get("cookie")?.value ??
        cookieStore.toString()
    ) ?? cookieStore.get(COOKIE_NAME)?.value ?? null;

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        fullName: payload.fullName,
        department: payload.department,
        role: payload.role,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "login") {
      // --- LOGIN ---
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email et mot de passe requis." },
          { status: 400 }
        );
      }

      const user = await getUserByEmail(email);
      if (!user) {
        return NextResponse.json(
          { error: "Email ou mot de passe incorrect." },
          { status: 401 }
        );
      }

      const passwordValid = await verifyPassword(password, user.password_hash);
      if (!passwordValid) {
        return NextResponse.json(
          { error: "Email ou mot de passe incorrect." },
          { status: 401 }
        );
      }

      // Générer JWT
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        department: user.department,
        role: user.role as "teacher" | "admin" | "guest",
      };
      const token = generateToken(payload);

      // Poser cookie httpOnly
      const cookieOpts = getSessionCookieOptions();
      const response = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          department: user.department,
          role: user.role,
        },
      });
      response.cookies.set({
        name: cookieOpts.name,
        value: token,
        httpOnly: cookieOpts.httpOnly,
        secure: cookieOpts.secure,
        sameSite: cookieOpts.sameSite,
        path: cookieOpts.path,
        maxAge: cookieOpts.maxAge,
      });
      return response;
    }

    if (action === "signup") {
      // --- SIGNUP ---
      const { email, password, fullName, department } = body;
      if (!email || !password || !fullName) {
        return NextResponse.json(
          { error: "Email, mot de passe et nom complet requis." },
          { status: 400 }
        );
      }
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Le mot de passe doit contenir au moins 8 caractères." },
          { status: 400 }
        );
      }

      // Vérifier email non déjà utilisé
      const exists = await emailExists(email);
      if (exists) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé. Connectez-vous." },
          { status: 409 }
        );
      }

      // Initialiser la table users si pas déjà fait
      try {
        await initializeDatabase();
      } catch {
        // La table existe probablement déjà — ignorer
      }

      // Hacher le mot de passe
      const passwordHash = await hashPassword(password);
      const userId = generateUserId();

      const user = await createUser(userId, email, passwordHash, fullName, department || null);
      if (!user) {
        return NextResponse.json(
          { error: "Inscription impossible. Réessayez." },
          { status: 500 }
        );
      }

      // Générer JWT immédiatement (auto-login après signup)
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        department: user.department,
        role: user.role as "teacher" | "admin" | "guest",
      };
      const token = generateToken(payload);

      const cookieOpts = getSessionCookieOptions();
      const response = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          department: user.department,
          role: user.role,
        },
        message: "Compte créé avec succès.",
      });
      response.cookies.set({
        name: cookieOpts.name,
        value: token,
        httpOnly: cookieOpts.httpOnly,
        secure: cookieOpts.secure,
        sameSite: cookieOpts.sameSite,
        path: cookieOpts.path,
        maxAge: cookieOpts.maxAge,
      });
      return response;
    }

    if (action === "logout") {
      // --- LOGOUT ---
      const response = NextResponse.json({ success: true });
      response.cookies.delete(COOKIE_NAME);
      return response;
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
