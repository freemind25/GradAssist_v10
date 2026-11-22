"use client";

import { toast } from "@/hooks/use-toast";
import { canDownloadFiles } from "@/lib/platform";

/**
 * Garde commune à tous les exports de fichiers.
 *
 * La WebView Android n'implémente pas le téléchargement : un `<a download>` ou
 * un `doc.save()` y est ignoré sans erreur. Les anciens messages de succès
 * (« fichier exporté ») étaient donc affichés alors que rien n'était écrit.
 *
 * `canExportFiles()` refuse l'export et explique quoi faire, au lieu de mentir.
 */

export function canExportFiles(): boolean {
  if (canDownloadFiles()) return true;

  toast({
    variant: "destructive",
    title: "Enregistrement impossible sur Android",
    description:
      "L'application Android ne peut pas enregistrer de fichier sur le téléphone. Ouvrez GradeAssist dans Chrome pour télécharger, ou utilisez « Enregistrer dans mon Drive » depuis l'onglet Rapports.",
  });
  return false;
}

/** Confirme qu'un téléchargement a été déclenché (sans garantir son issue). */
export function notifyDownloadStarted(filename: string): void {
  toast({
    title: "Téléchargement lancé",
    description: `${filename} — vérifiez le dossier Téléchargements de votre appareil.`,
  });
}
