"use client";

import { useEffect, useState } from 'react';
import { decodeDataUrl } from '@/lib/syllabus-pdf-store';

/**
 * Rend un PDF en images pour l'afficher dans l'application, sans téléchargement.
 */
export function PdfPagesView({ dataUrl }: { dataUrl: string }) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function renderPdf() {
      try {
        setLoading(true);
        setError(null);
        // Build « legacy » : pdf.js v6 repose sur des API JS très récentes
        // (Uint8Array.toHex(), nécessite Chromium ≥ 140) absentes de
        // l'app Desktop Electron 33 (Chromium 130) — erreur « n.toHex is
        // not a function ». Le build legacy conserve la compatibilité.
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        // Worker servi depuis la même origine (copié dans public/ au postinstall).
        // unpkg.com est bloqué par la CSP de production (script-src 'self').
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.legacy.min.mjs';

        let arrayBuffer: ArrayBuffer;
        if (dataUrl.startsWith('data:')) {
          const { bytes } = decodeDataUrl(dataUrl);
          arrayBuffer = bytes.buffer as ArrayBuffer;
        } else {
          // URL blob: ou http(s) — conversion via Blob sans fetch réseau
          const res = await fetch(dataUrl);
          if (!res.ok) {
            throw new Error(`Chargement du fichier impossible (${res.status})`);
          }
          arrayBuffer = await res.arrayBuffer();
        }
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const renderedPages: string[] = [];
        const scale = 1.5;

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) break;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
            renderedPages.push(canvas.toDataURL('image/png'));
          }
        }

        if (!cancelled) {
          setPages(renderedPages);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[syllabus] Erreur de rendu PDF:', err);
          const detail = err instanceof Error && err.message ? err.message : '';
          setError(
            'Impossible de lire le PDF.' +
              (detail ? ` (${detail})` : ' Fichier corrompu ou non supporté.') +
              ' Vous pouvez le réimporter depuis l\'onglet Chapters.'
          );
          setLoading(false);
        }
      }
    }
    renderPdf();
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Conversion du PDF en images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto rounded-lg border bg-gray-100 p-4">
      {pages.map((pageDataUrl, idx) => (
        <div key={idx} className="bg-white shadow-md rounded-lg overflow-hidden">
          <img
            src={pageDataUrl}
            alt={`Page ${idx + 1}`}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
