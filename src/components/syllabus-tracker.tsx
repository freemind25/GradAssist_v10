"use client";

import * as React from 'react';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { CourseSyllabus, SyllabusChapter } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CalendarDays, FileUp, FileText, Plus, Trash2, Eye, BarChart3,
  BookOpen, Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_SYLLABUS,
  STATUS_CONFIG,
  addSubchapterToTree,
  computeProgress,
  createChapter,
  createSampleChapters,
  cycleStatusInTree,
  filterChapterTree,
  flattenChapters,
  getProgressColor,
  removeChapterFromTree,
  updateChapterInTree,
  type EditableChapterField,
} from '@/lib/syllabus';
import {
  LEGACY_DB_KEY,
  dataUrlToBlobUrl,
  loadPdfFromIDB,
  pdfKey,
  savePdfToIDB,
} from '@/lib/syllabus-pdf-store';
import { ChapterRow } from '@/components/syllabus/chapter-row';
import { PdfPagesView } from '@/components/syllabus/pdf-pages-view';

interface SyllabusTrackerProps {
  syllabus: CourseSyllabus;
  setSyllabus: (value: CourseSyllabus) => void;
  moduleName: string;
  /** Identifiant du module : sert de clé au PDF stocké dans IndexedDB. */
  moduleId: string;
}

export function SyllabusTracker({ syllabus: syllabusProp, setSyllabus, moduleName, moduleId }: SyllabusTrackerProps) {
  const syllabus = syllabusProp ?? DEFAULT_SYLLABUS;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'chapters' | 'planning' | 'preview'>('chapters');
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Charge le PDF de CE module. Migre au passage l'ancienne clé unique
  // (« current_pdf ») vers la clé du module, pour ne rien perdre.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!syllabus.pdfFileName) {
        setPdfDataUrl(null);
        setPdfBlobUrl(null);
        return;
      }

      setPdfLoading(true);
      try {
        let dataUrl = await loadPdfFromIDB(pdfKey(moduleId));

        if (!dataUrl) {
          const legacy = await loadPdfFromIDB(LEGACY_DB_KEY);
          if (legacy) {
            dataUrl = legacy;
            await savePdfToIDB(pdfKey(moduleId), legacy);
          }
        }

        if (cancelled) return;

        if (!dataUrl) {
          setPdfDataUrl(null);
          setPdfBlobUrl(null);
          return;
        }

        setPdfDataUrl(dataUrl);
        // Conversion base64 → Blob URL pour l'iframe (évite les data URL géantes)
        setPdfBlobUrl(dataUrlToBlobUrl(dataUrl));
      } catch {
        if (!cancelled) {
          setPdfDataUrl(null);
          setPdfBlobUrl(null);
        }
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [syllabus.pdfFileName, moduleId]);

  const progress = useMemo(() => computeProgress(syllabus.chapters), [syllabus.chapters]);

  // All chapters flat for planning view
  const allChaptersFlat = useMemo(() => flattenChapters(syllabus.chapters), [syllabus.chapters]);

  // Sorted by planned date for planning view
  const sortedChapters = useMemo(() => {
    return [...allChaptersFlat]
      .filter(ch => ch.plannedDate)
      .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
  }, [allChaptersFlat]);

  // ─── PDF Import ───
  const handlePdfImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: "Erreur", description: "Veuillez sélectionner un fichier PDF.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;

      // Save PDF to IndexedDB (large file, doesn't fit in localStorage)
      try {
        await savePdfToIDB(pdfKey(moduleId), dataUrl);
      } catch {
        // If IndexedDB fails, store a truncated version in state as fallback
        console.warn('IndexedDB save failed, PDF preview may not work');
      }

      // Update syllabus metadata (without the large dataUrl to avoid localStorage overflow)
      setSyllabus({
        ...syllabus,
        pdfFileName: file.name,
        pdfDataUrl: null, // Not stored in localStorage - stored in IndexedDB
      });

      // Create Blob URL immediately for iframe
      setPdfBlobUrl(dataUrlToBlobUrl(dataUrl));
      setPdfDataUrl(dataUrl);

      toast({
        title: "PDF importé",
        description: `"${file.name}" a été importé. Ajoutez vos chapitres ci-dessous.`,
      });
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  }, [syllabus, setSyllabus, toast, moduleId]);

  // ─── Sample chapters from common French university syllabi ───
  const handleLoadSampleChapters = useCallback(() => {
    setSyllabus({ ...syllabus, chapters: createSampleChapters() });
    toast({ title: "Modèle chargé", description: "6 chapitres ajoutés. Modifiez-les selon votre canevas." });
  }, [syllabus, setSyllabus, toast]);

  // ─── Chapter CRUD ───
  const handleUpdate = (id: string, field: EditableChapterField, value: string) => {
    setSyllabus({ ...syllabus, chapters: updateChapterInTree(syllabus.chapters, id, field, value) });
  };

  const handleRemove = (id: string) => {
    setSyllabus({ ...syllabus, chapters: removeChapterFromTree(syllabus.chapters, id) });
  };

  const handleAddSub = (parentId: string) => {
    setSyllabus({ ...syllabus, chapters: addSubchapterToTree(syllabus.chapters, parentId) });
  };

  const handleCycleStatus = (id: string) => {
    setSyllabus({ ...syllabus, chapters: cycleStatusInTree(syllabus.chapters, id) });
  };

  const handleAddChapter = () => {
    const chapter: SyllabusChapter = createChapter(
      `Chapitre ${syllabus.chapters.length + 1}`,
      syllabus.chapters.length
    );
    setSyllabus({ ...syllabus, chapters: [...syllabus.chapters, chapter] });
  };

  const handleRemovePdf = async () => {
    try { await savePdfToIDB(pdfKey(moduleId), null); } catch { /* ignore */ }
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setPdfDataUrl(null);
    setSyllabus({ ...syllabus, pdfFileName: null, pdfDataUrl: null });
    toast({ title: "PDF supprimé", description: "Le fichier PDF a été retiré." });
  };

  // ─── Filtered chapters for search ───
  const filteredChapters = useMemo(
    () => filterChapterTree(syllabus.chapters, searchTerm),
    [syllabus.chapters, searchTerm]
  );

  // ─── Stats ───
  const stats = useMemo(() => {
    const notStarted = allChaptersFlat.filter(c => c.status === 'not_started').length;
    const overdue = allChaptersFlat.filter(c => c.plannedEndDate && c.status !== 'completed' && c.plannedEndDate < new Date().toISOString().slice(0, 10)).length;
    return { notStarted, overdue };
  }, [allChaptersFlat]);

  return (
    <div className="space-y-4">
      {/* ═══ Header with PDF import ═══ */}
      <Card className="card-premium overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary/60 via-accent to-primary/60" />
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Canevas du Cours — {moduleName}
          </CardTitle>
          <CardDescription>
            Importez le PDF du canevas officiel, suivez l&apos;avancement des chapitres et établissez un planning prévisionnel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PDF Import */}
            <div className="md:col-span-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfImport}
                className="hidden"
              />
              {syllabus.pdfFileName ? (
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <FileText className="h-8 w-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{syllabus.pdfFileName}</p>
                    <p className="text-xs text-muted-foreground">PDF du canevas importé</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleLoadSampleChapters} className="shrink-0">
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Modèle de chapitres
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { if (pdfBlobUrl) window.open(pdfBlobUrl, '_blank'); }} className="shrink-0">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Voir
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleRemovePdf} className="shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border hover:border-primary/40 rounded-xl transition-all hover:bg-primary/5 group"
                >
                  <FileUp className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Importer le PDF du canevas</p>
                    <p className="text-xs text-muted-foreground">Cliquez ou glissez-déposez votre fichier PDF ici</p>
                  </div>
                </button>
              )}
            </div>

            {/* Progress */}
            <div className="flex flex-col justify-center p-4 bg-muted/30 rounded-xl border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Avancement global</span>
              </div>
              <div className="relative h-3 bg-border rounded-full overflow-hidden mb-2">
                <div
                  className={cn("absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all duration-500", getProgressColor(progress.percentage))}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress.completed}/{progress.total} chapitres</span>
                <span className="font-bold text-foreground">{progress.percentage}%</span>
              </div>
              {stats.overdue > 0 && (
                <p className="text-xs text-destructive mt-1">⚠️ {stats.overdue} chapitre(s) en retard</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ View Tabs ═══ */}
      <div className="flex gap-2">
        {[
          { id: 'chapters' as const, label: 'Chapitres', icon: BookOpen },
          { id: 'planning' as const, label: 'Planning', icon: CalendarDays },
          { id: 'preview' as const, label: 'Aperçu PDF', icon: Eye },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Chapters View ═══ */}
      {view === 'chapters' && (
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/60 via-accent to-primary/60" />
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Suivi des Chapitres</CardTitle>
                <CardDescription>
                  Cliquez sur le statut pour alterner : Non commencé → En cours → Terminé
                </CardDescription>
              </div>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un chapitre..."
                className="w-60 h-8 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredChapters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun chapitre. Ajoutez-en un ou importez le PDF du canevas.</p>
              </div>
            ) : (
              filteredChapters.map(ch => (
                <ChapterRow
                  key={ch.id}
                  chapter={ch}
                  depth={0}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                  onAddSub={handleAddSub}
                  onCycleStatus={handleCycleStatus}
                />
              ))
            )}
            <button
              onClick={handleAddChapter}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-dashed border-border w-full justify-center mt-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un chapitre
            </button>
          </CardContent>
        </Card>
      )}

      {/* ═══ Planning View ═══ */}
      {view === 'planning' && (
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-accent via-primary to-accent" />
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-accent" />
              Planning Prévisionnel
            </CardTitle>
            <CardDescription>
              Vue chronologique des chapitres planifiés. Définissez les dates dans l&apos;onglet &quot;Chapitres&quot;.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedChapters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune date planifiée. Ajoutez des dates dans l&apos;onglet Chapitres.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Timeline header */}
                <div className="grid grid-cols-[80px_1fr_120px_120px_100px] gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b">
                  <span>N°</span>
                  <span>Chapitre</span>
                  <span>Début prévu</span>
                  <span>Fin prévue</span>
                  <span>Statut</span>
                </div>
                {sortedChapters.map((ch, idx) => {
                  const config = STATUS_CONFIG[ch.status];
                  const StatusIcon = config.icon;
                  const isOverdue = ch.plannedEndDate && ch.status !== 'completed' && ch.plannedEndDate < new Date().toISOString().slice(0, 10);
                  const today = new Date().toISOString().slice(0, 10);
                  const isCurrent = ch.plannedDate <= today && ch.plannedEndDate >= today;

                  return (
                    <div
                      key={ch.id}
                      className={cn(
                        "grid grid-cols-[80px_1fr_120px_120px_100px] gap-2 px-3 py-2 rounded-lg border text-sm items-center transition-all",
                        isOverdue ? "bg-red-50 border-red-200" : isCurrent ? "bg-blue-50 border-blue-200" : "bg-background border-border",
                      )}
                    >
                      <span className="font-mono text-xs text-muted-foreground">{idx + 1}</span>
                      <span className={cn("font-medium", ch.status === 'completed' && "line-through opacity-60")}>{ch.title}</span>
                      <span className="text-xs">{ch.plannedDate ? new Date(ch.plannedDate + 'T00:00:00').toLocaleDateString('fr-FR') : '—'}</span>
                      <span className={cn("text-xs", isOverdue && "text-destructive font-medium")}>
                        {ch.plannedEndDate ? new Date(ch.plannedEndDate + 'T00:00:00').toLocaleDateString('fr-FR') : '—'}
                        {isOverdue && ' ⚠️'}
                      </span>
                      <span className={cn("flex items-center gap-1 text-xs font-medium", config.color)}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ PDF Preview ═══ */}
      {view === 'preview' && (
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-primary to-emerald-500" />
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Aperçu du Canevas
            </CardTitle>
            <CardDescription>Visualisez le PDF du canevas officiel importé.</CardDescription>
          </CardHeader>
          <CardContent>
            {pdfLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p>Chargement du PDF...</p>
              </div>
            ) : pdfDataUrl ? (
              <PdfPagesView dataUrl={pdfDataUrl} />
            ) : pdfBlobUrl ? (
              <PdfPagesView dataUrl={pdfBlobUrl} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>Aucun PDF importé. Utilisez le bouton ci-dessus pour importer le canevas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
