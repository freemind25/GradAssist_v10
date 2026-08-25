"use client";

import * as React from 'react';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { CourseSyllabus, SyllabusChapter, ChapterStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronDown, ChevronRight, FileUp, FileText, Plus, Trash2,
  CheckCircle2, Circle, Clock, CalendarDays, Eye, BarChart3,
  GripVertical, BookOpen, Download, Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SyllabusTrackerProps {
  syllabus: CourseSyllabus;
  setSyllabus: (value: CourseSyllabus) => void;
  moduleName: string;
}

const STATUS_CONFIG: Record<ChapterStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  not_started: { label: 'Non commencé', icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border' },
  in_progress: { label: 'En cours', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
  completed: { label: 'Terminé', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300' },
};

function generateId(): string {
  return `ch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function flattenChapters(chapters: SyllabusChapter[]): SyllabusChapter[] {
  const result: SyllabusChapter[] = [];
  for (const ch of chapters) {
    result.push(ch);
    if (ch.subchapters.length > 0) {
      result.push(...flattenChapters(ch.subchapters));
    }
  }
  return result;
}

function computeProgress(chapters: SyllabusChapter[]): { total: number; completed: number; inProgress: number; percentage: number } {
  const flat = flattenChapters(chapters);
  const total = flat.length;
  if (total === 0) return { total: 0, completed: 0, inProgress: 0, percentage: 0 };
  const completed = flat.filter(c => c.status === 'completed').length;
  const inProgress = flat.filter(c => c.status === 'in_progress').length;
  return { total, completed, inProgress, percentage: Math.round((completed / total) * 100) };
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return 'from-emerald-500 to-emerald-600';
  if (pct >= 50) return 'from-blue-500 to-blue-600';
  if (pct >= 25) return 'from-amber-500 to-amber-600';
  return 'from-red-400 to-red-500';
}

// ─── Chapter Row Component ───
function ChapterRow({
  chapter,
  depth,
  onToggle,
  onUpdate,
  onRemove,
  onAddSub,
  onCycleStatus,
}: {
  chapter: SyllabusChapter;
  depth: number;
  onToggle: (id: string) => void;
  onUpdate: (id: string, field: string, value: string) => void;
  onRemove: (id: string) => void;
  onAddSub: (parentId: string) => void;
  onCycleStatus: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const config = STATUS_CONFIG[chapter.status];
  const StatusIcon = config.icon;
  const hasSub = chapter.subchapters.length > 0;

  return (
    <div className={cn("rounded-lg border transition-all duration-200", config.border, config.bg)}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => hasSub && setExpanded(!expanded)}
          className={cn("shrink-0 p-0.5 rounded transition-colors", hasSub ? "hover:bg-black/5 text-muted-foreground" : "opacity-30")}
        >
          {hasSub ? (expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="w-4" />}
        </button>

        <span className={cn("shrink-0", config.color)}>
          <StatusIcon className="h-5 w-5" />
        </span>

        {editing ? (
          <Input
            value={chapter.title}
            onChange={(e) => onUpdate(chapter.id, 'title', e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            autoFocus
            className="h-7 text-sm flex-1"
          />
        ) : (
          <span
            className={cn("flex-1 text-sm font-medium cursor-text", chapter.status === 'completed' && "line-through opacity-70")}
            onClick={() => setEditing(true)}
          >
            {chapter.title}
          </span>
        )}

        {/* Status cycle button */}
        <button
          onClick={() => onCycleStatus(chapter.id)}
          className={cn("shrink-0 px-2 py-1 rounded-md text-xs font-medium transition-all hover:opacity-80", config.bg, config.color, "border", config.border)}
          title="Changer le statut"
        >
          {config.label}
        </button>

        {/* Dates */}
        <input
          type="date"
          value={chapter.plannedDate}
          onChange={(e) => onUpdate(chapter.id, 'plannedDate', e.target.value)}
          className="shrink-0 h-7 text-xs border rounded px-1.5 bg-white/80 w-[120px]"
          title="Date de début prévue"
        />
        <span className="text-xs text-muted-foreground">→</span>
        <input
          type="date"
          value={chapter.plannedEndDate}
          onChange={(e) => onUpdate(chapter.id, 'plannedEndDate', e.target.value)}
          className="shrink-0 h-7 text-xs border rounded px-1.5 bg-white/80 w-[120px]"
          title="Date de fin prévue"
        />

        {/* Actions */}
        <button
          onClick={() => onAddSub(chapter.id)}
          className="shrink-0 p-1 rounded hover:bg-blue-100 text-blue-500 transition-colors"
          title="Ajouter un sous-chapitre"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(chapter.id)}
          className="shrink-0 p-1 rounded hover:bg-red-100 text-red-400 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Notes (collapsible) */}
      {editing && (
        <div className="px-3 pb-2">
          <Textarea
            value={chapter.notes}
            onChange={(e) => onUpdate(chapter.id, 'notes', e.target.value)}
            placeholder="Notes, observation, remarques..."
            className="text-xs h-16 resize-none"
          />
        </div>
      )}

      {/* Subchapters */}
      {expanded && hasSub && (
        <div className="pl-6 pb-1 space-y-1">
          {chapter.subchapters.map(sub => (
            <ChapterRow
              key={sub.id}
              chapter={sub}
              depth={depth + 1}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAddSub={onAddSub}
              onCycleStatus={onCycleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───
const DEFAULT_SYLLABUS: CourseSyllabus = { chapters: [], pdfFileName: null, pdfDataUrl: null };

// ─── IndexedDB helpers for large PDF storage ───
const DB_NAME = 'GradeAssist_Syllabus';
const DB_STORE = 'pdfs';
const DB_KEY = 'current_pdf';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('No window')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(DB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePdfToIDB(dataUrl: string | null): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    if (dataUrl) {
      store.put(dataUrl, DB_KEY);
    } else {
      store.delete(DB_KEY);
    }
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function loadPdfFromIDB(): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.get(DB_KEY);
    req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

// ─── PDF Pages Renderer (renders PDF as images to avoid browser download) ───
function PdfPagesView({ dataUrl }: { dataUrl: string }) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function renderPdf() {
      try {
        setLoading(true);
        setError(null);
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const response = await fetch(dataUrl);
        const arrayBuffer = await response.arrayBuffer();
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
          setError('Impossible de lire le PDF. Fichier corrompu ou non supporté.');
          setLoading(false);
        }
      }
    }
    renderPdf();
    return () => { cancelled = true; };
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

export function SyllabusTracker({ syllabus: syllabusProp, setSyllabus, moduleName }: SyllabusTrackerProps) {
  const syllabus = syllabusProp ?? DEFAULT_SYLLABUS;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'chapters' | 'planning' | 'preview'>('chapters');
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Load PDF from IndexedDB on mount or when fileName changes
  useEffect(() => {
    if (syllabus.pdfFileName) {
      setPdfLoading(true);
      loadPdfFromIDB()
        .then((dataUrl) => {
          if (dataUrl) {
            // Convert base64 data URL to Blob URL for iframe (avoids data URL size issues)
            const parts = dataUrl.split(',');
            const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
            const binary = atob(parts[1]);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            setPdfBlobUrl(blobUrl);
          } else {
            setPdfBlobUrl(null);
          }
        })
        .catch(() => setPdfBlobUrl(null))
        .finally(() => setPdfLoading(false));
    } else {
      setPdfBlobUrl(null);
    }
  }, [syllabus.pdfFileName]);

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
        await savePdfToIDB(dataUrl);
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
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const binary = atob(parts[1]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);

      toast({
        title: "PDF importé",
        description: `"${file.name}" a été importé. Ajoutez vos chapitres ci-dessous.`,
      });
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  }, [syllabus, setSyllabus, toast]);

  // ─── Sample chapters from common French university syllabi ───
  const handleLoadSampleChapters = useCallback(() => {
    const sampleChapters: SyllabusChapter[] = [
      { id: generateId(), title: 'Introduction générale', order: 0, status: 'not_started', plannedDate: '', plannedEndDate: '', notes: '', subchapters: [] },
      { id: generateId(), title: 'Chapitre 1', order: 1, status: 'not_started', plannedDate: '', plannedEndDate: '', notes: '', subchapters: [] },
      { id: generateId(), title: 'Chapitre 2', order: 2, status: 'not_started', plannedDate: '', plannedEndDate: '', notes: '', subchapters: [] },
      { id: generateId(), title: 'Chapitre 3', order: 3, status: 'not_started', plannedDate: '', plannedEndDate: '', notes: '', subchapters: [] },
      { id: generateId(), title: 'Chapitre 4', order: 4, status: 'not_started', plannedDate: '', plannedEndDate: '', notes: '', subchapters: [] },
      { id: generateId(), title: 'Conclusion générale', order: 5, status: 'not_started', plannedDate: '', plannedEndDate: '', notes: '', subchapters: [] },
    ];
    setSyllabus({ ...syllabus, chapters: sampleChapters });
    toast({ title: "Modèle chargé", description: "6 chapitres ajoutés. Modifiez-les selon votre canevas." });
  }, [syllabus, setSyllabus, toast]);

  // ─── Chapter CRUD ───
  const updateChapterInTree = useCallback((chapters: SyllabusChapter[], id: string, field: string, value: string): SyllabusChapter[] => {
    return chapters.map(ch => {
      if (ch.id === id) return { ...ch, [field]: value };
      if (ch.subchapters.length > 0) {
        return { ...ch, subchapters: updateChapterInTree(ch.subchapters, id, field, value) };
      }
      return ch;
    });
  }, []);

  const removeChapterFromTree = useCallback((chapters: SyllabusChapter[], id: string): SyllabusChapter[] => {
    return chapters
      .filter(ch => ch.id !== id)
      .map(ch => ({ ...ch, subchapters: removeChapterFromTree(ch.subchapters, id) }));
  }, []);

  const addSubchapterToTree = useCallback((chapters: SyllabusChapter[], parentId: string): SyllabusChapter[] => {
    return chapters.map(ch => {
      if (ch.id === parentId) {
        return {
          ...ch,
          subchapters: [...ch.subchapters, {
            id: generateId(),
            title: 'Sous-chapitre',
            order: ch.subchapters.length,
            status: 'not_started' as ChapterStatus,
            plannedDate: '',
            plannedEndDate: '',
            notes: '',
            subchapters: [],
          }],
        };
      }
      if (ch.subchapters.length > 0) {
        return { ...ch, subchapters: addSubchapterToTree(ch.subchapters, parentId) };
      }
      return ch;
    });
  }, []);

  const cycleStatusInTree = useCallback((chapters: SyllabusChapter[], id: string): SyllabusChapter[] => {
    const cycle: ChapterStatus[] = ['not_started', 'in_progress', 'completed'];
    return chapters.map(ch => {
      if (ch.id === id) {
        const nextIdx = (cycle.indexOf(ch.status) + 1) % cycle.length;
        return { ...ch, status: cycle[nextIdx] };
      }
      if (ch.subchapters.length > 0) {
        return { ...ch, subchapters: cycleStatusInTree(ch.subchapters, id) };
      }
      return ch;
    });
  }, []);

  const handleUpdate = (id: string, field: string, value: string) => {
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
    setSyllabus({
      ...syllabus,
      chapters: [...syllabus.chapters, {
        id: generateId(),
        title: `Chapitre ${syllabus.chapters.length + 1}`,
        order: syllabus.chapters.length,
        status: 'not_started',
        plannedDate: '',
        plannedEndDate: '',
        notes: '',
        subchapters: [],
      }],
    });
  };

  const handleRemovePdf = async () => {
    try { await savePdfToIDB(null); } catch { /* ignore */ }
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setSyllabus({ ...syllabus, pdfFileName: null, pdfDataUrl: null });
    toast({ title: "PDF supprimé", description: "Le fichier PDF a été retiré." });
  };

  // ─── Filtered chapters for search ───
  const filteredChapters = useMemo(() => {
    if (!searchTerm.trim()) return syllabus.chapters;
    const lower = searchTerm.toLowerCase();
    const filterTree = (chapters: SyllabusChapter[]): SyllabusChapter[] => {
      return chapters.filter(ch => {
        const titleMatch = ch.title.toLowerCase().includes(lower);
        const noteMatch = ch.notes.toLowerCase().includes(lower);
        const subMatch = filterTree(ch.subchapters).length > 0;
        return titleMatch || noteMatch || subMatch;
      }).map(ch => ({ ...ch, subchapters: filterTree(ch.subchapters) }));
    };
    return filterTree(syllabus.chapters);
  }, [syllabus.chapters, searchTerm]);

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
                  onToggle={() => {}}
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
