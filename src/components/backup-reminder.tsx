"use client";

import { AlertTriangle, Download, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BACKUP_REMINDER_DAYS,
  formatBytes,
  type BackupStatus,
  type SafetySnapshotInfo,
} from "@/lib/backup-service";

/**
 * Rappel de sauvegarde.
 *
 * Les données pédagogiques ne quittent pas l'appareil : vider les données du
 * navigateur, changer de téléphone ou réinstaller l'application les efface
 * sans retour. Ce bandeau rend cet écart visible — il n'apparaît que lorsque
 * la dernière sauvegarde téléchargée est absente ou ancienne, ou lorsqu'une
 * copie de sécurité automatique est disponible.
 *
 * Composant purement présentatif : l'export et la restauration sont pilotés
 * par `page.tsx`, qui possède les modules.
 */

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function delayLabel(days: number | null): string {
  if (days === null) return "Aucune sauvegarde téléchargée pour l'instant.";
  if (days <= 0) return "Dernière sauvegarde aujourd'hui.";
  if (days === 1) return "Dernière sauvegarde hier.";
  return `Dernière sauvegarde il y a ${days} jours.`;
}

export interface BackupReminderProps {
  status: BackupStatus;
  /** Taille des données en cours, pour situer l'enjeu. */
  storageBytes: number;
  safetySnapshot: SafetySnapshotInfo | null;
  onBackup: () => void;
  onRestoreSafety: () => void;
  onDismiss: () => void;
}

export function BackupReminder({
  status,
  storageBytes,
  safetySnapshot,
  onBackup,
  onRestoreSafety,
  onDismiss,
}: BackupReminderProps) {
  const showStale = status.stale;
  if (!showStale && !safetySnapshot) return null;

  const urgent = !status.lastBackupAt;

  return (
    <div
      role="status"
      className={`relative rounded-lg border-l-4 p-4 pr-10 text-sm ${
        urgent
          ? "border-l-destructive bg-destructive/5"
          : "border-l-accent bg-accent/10"
      }`}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Masquer le rappel de sauvegarde"
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      {showStale && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {urgent
                  ? "Vos données n'existent que dans ce navigateur"
                  : `Pensez à sauvegarder (dernière sauvegarde : ${status.lastBackupAt ? formatDate(status.lastBackupAt) : "jamais"})`}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {delayLabel(status.daysSinceBackup)} Vider les données du
                navigateur ou changer d&apos;appareil les effacerait
                définitivement. {formatBytes(storageBytes)} à protéger.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={onBackup} className="shrink-0">
            <Download className="mr-2 h-4 w-4" />
            Télécharger une sauvegarde
          </Button>
        </div>
      )}

      {safetySnapshot && (
        <div
          className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
            showStale ? "mt-3 border-t border-border pt-3" : ""
          }`}
        >
          <div className="flex gap-3">
            <History className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              Copie de sécurité du{" "}
              <span className="text-foreground">
                {formatDate(safetySnapshot.savedAt)}
              </span>{" "}
              ({safetySnapshot.moduleCount} module(s),{" "}
              {safetySnapshot.reason || "avant une opération"}). PDF de canevas
              et logo non inclus dans cette copie.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRestoreSafety}
            className="shrink-0"
          >
            Restaurer cette copie
          </Button>
        </div>
      )}

      {showStale && status.lastBackupAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          Rappel affiché au-delà de {BACKUP_REMINDER_DAYS} jours sans sauvegarde.
        </p>
      )}
    </div>
  );
}
