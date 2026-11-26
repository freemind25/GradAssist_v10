"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Filet de sécurité d'affichage.
 *
 * Sans ce fichier, une exception levée pendant le rendu laissait un écran
 * blanc sans explication ni issue. Les données pédagogiques restent sur
 * l'appareil : recharger l'application ne les perd pas, et rien ici ne les
 * touche.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GradeAssist] Erreur d'affichage :", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h1 className="text-lg font-semibold">
              Un problème est survenu à l&apos;affichage
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vos modules restent enregistrés sur cet appareil. Essayez de
              recharger l&apos;écran ; si le problème persiste, rechargez
              l&apos;application, puis restaurez une sauvegarde JSON si
              nécessaire.
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Référence : {error.digest}
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Réessayer
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Recharger l&apos;application
          </button>
        </div>
      </div>
    </div>
  );
}
