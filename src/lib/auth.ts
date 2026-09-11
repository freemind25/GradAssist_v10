import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * [SEC-04b] Authentification par mot de passe + JWT — alternative à Supabase Auth.
 *
 * Utilise Neon PostgreSQL directement (pas de service Auth tiers) :
 * - Mots de passe hachés avec bcrypt (10 rounds — équilibre sécurité/perf)
 * - Sessions stateless via JWT signé (HS256) stocké en cookie httpOnly
 * - Pas de table sessions — le JWT contient toutes les infos nécessaires
 *
 * Variables d'environnement requises :
 * - JWT_SECRET : clé secrète pour signer les tokens (openssl rand -base64 32)
 * - DATABASE_URL : connexion Neon PostgreSQL
 */

const BCRYPT_ROUNDS = 10;
const JWT_ALGORITHM = "HS256";
const JWT_EXPIRES_IN = "8h"; // 8 heures — session de travail
const COOKIE_NAME = "gradeassist_session";

export interface JwtPayload {
  userId: string;
  email: string;
  fullName: string;
  department: string | null;
  role: "teacher" | "admin" | "guest";
}

/**
 * Hache un mot de passe avec bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Vérifie un mot de passe contre un hash bcrypt.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Génère un JWT signé pour un utilisateur.
 */
export function generateToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("[auth] JWT_SECRET non configuré. Générez avec : openssl rand -base64 32");
  }
  return jwt.sign(payload, secret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Vérifie et décode un JWT.
 * Retourne null si le token est invalide, expiré, ou si JWT_SECRET manque.
 */
export function verifyToken(token: string | undefined | null): JwtPayload | null {
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] });
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Récupère le JWT depuis les cookies de la requête (côté serveur).
 */
export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map(c => c.trim());
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name?.trim() === COOKIE_NAME) {
      return valueParts.join("=");
    }
  }
  return null;
}

/**
 * Renvoie les options du cookie de session (httpOnly, secure, sameSite).
 */
export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 8 * 60 * 60, // 8 heures en secondes
  };
}

export { COOKIE_NAME };
