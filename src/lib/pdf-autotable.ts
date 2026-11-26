/**
 * `jspdf-autotable` augmente l'instance jsPDF avec `lastAutoTable` après un
 * rendu de tableau, sans que les types de jsPDF le déclarent. Ce helper
 * centralise l'accès pour éviter un `as any` dupliqué dans chaque export.
 */
export function getLastAutoTableFinalY(doc: unknown, fallback: number): number {
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    ?.finalY;
  return finalY || fallback;
}
