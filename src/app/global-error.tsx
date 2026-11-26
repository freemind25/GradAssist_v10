"use client";

import { useEffect } from "react";

/**
 * Limite d'erreur globale (root layout).
 *
 * Dernier filet : lorsqu'une erreur survient dans le layout racine lui-même,
 * Next remplace toute la page par ce composant. Les styles globaux n'étant
 * plus chargés, la mise en forme est écrite en inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GradeAssist] Erreur fatale :", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "24px",
          }}
        >
          <h1 style={{ fontSize: "18px", margin: 0 }}>
            GradeAssist n&apos;a pas pu démarrer
          </h1>
          <p
            style={{
              marginTop: "12px",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            Vos modules restent enregistrés sur cet appareil. Rechargez
            l&apos;application pour reprendre ; en cas d&apos;échec répété,
            videz le cache du navigateur puis restaurez votre sauvegarde JSON
            (menu Fichier).
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#64748b",
                fontFamily: "monospace",
              }}
            >
              Référence : {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "20px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              background: "#0f172a",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
