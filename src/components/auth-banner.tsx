"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

/**
 * [SEC-04c] Bannière de migration douce — voie 3 du plan P1.
 *
 * Affichée en haut de l'application pour les utilisateurs NON authentifiés,
 * pendant 7 jours après le déploiement (jusqu'au 2 octobre 2026).
 * Inviter les enseignants à créer leur compte.
 *
 * Conditions d'affichage :
 * - Utilisateur non authentifié (pas de session Supabase)
 * - Pas sur une page /auth/* (déjà sur page auth)
 * - Date actuelle < 2 octobre 2026 (bannière désactivée après)
 * - Pas déjà dismiss (localStorage)
 */

const BANNER_END_DATE = new Date("2026-10-02T00:00:00");
const DISMISS_KEY = "gradeAssist_auth_banner_dismissed";

export function AuthBanner({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isAuthPage = pathname?.startsWith("/auth/");
    const isExpired = new Date() > BANNER_END_DATE;
    const isDismissed =
      typeof window !== "undefined" &&
      localStorage.getItem(DISMISS_KEY) === "true";

    setShow(!isAuthenticated && !isAuthPage && !isExpired && !isDismissed);
  }, [isAuthenticated, pathname]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, "true");
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="alert"
      className="bg-amber-50 border-y-2 border-amber-500 px-4 py-3 sticky top-0 z-40"
    >
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="text-sm text-amber-900">
            <strong>Action requise</strong> — Nouveau système de connexion.
            Créez votre compte enseignant avant le 2 octobre pour continuer à utiliser GradeAssist.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/auth/login"
            className="text-sm text-amber-900 underline underline-offset-4 hover:text-amber-700"
          >
            Se connecter
          </Link>
          <Link
            href="/auth/signup"
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Créer un compte
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-amber-700 hover:text-amber-900 p-1"
            aria-label="Fermer la bannière"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
