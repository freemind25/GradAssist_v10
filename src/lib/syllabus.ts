import type { ElementType } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type {
  ChapterStatus,
  CourseSyllabus,
  SyllabusChapter,
} from '@/types';

/** Champs modifiables en ligne depuis une ligne de chapitre. */
export type EditableChapterField =
  | 'title'
  | 'plannedDate'
  | 'plannedEndDate'
  | 'notes';

export const STATUS_CONFIG: Record<
  ChapterStatus,
  {
    label: string;
    icon: ElementType;
    color: string;
    bg: string;
    border: string;
  }
> = {
  not_started: {
    label: 'Non commencé',
    icon: Circle,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
    border: 'border-border',
  },
  in_progress: {
    label: 'En cours',
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
  },
  completed: {
    label: 'Terminé',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
  },
};

export const STATUS_CYCLE: ChapterStatus[] = [
  'not_started',
  'in_progress',
  'completed',
];

export const DEFAULT_SYLLABUS: CourseSyllabus = {
  chapters: [],
  pdfFileName: null,
  pdfDataUrl: null,
};

export function generateId(): string {
  return `ch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createChapter(
  title: string,
  order: number
): SyllabusChapter {
  return {
    id: generateId(),
    title,
    order,
    status: 'not_started',
    plannedDate: '',
    plannedEndDate: '',
    notes: '',
    subchapters: [],
  };
}

/** Chapitres proposés comme modèle de départ. */
export function createSampleChapters(): SyllabusChapter[] {
  return [
    'Introduction générale',
    'Chapitre 1',
    'Chapitre 2',
    'Chapitre 3',
    'Chapitre 4',
    'Conclusion générale',
  ].map((title, order) => createChapter(title, order));
}

export function flattenChapters(chapters: SyllabusChapter[]): SyllabusChapter[] {
  const result: SyllabusChapter[] = [];
  for (const ch of chapters) {
    result.push(ch);
    if (ch.subchapters.length > 0) {
      result.push(...flattenChapters(ch.subchapters));
    }
  }
  return result;
}

export function computeProgress(chapters: SyllabusChapter[]): {
  total: number;
  completed: number;
  inProgress: number;
  percentage: number;
} {
  const flat = flattenChapters(chapters);
  const total = flat.length;
  if (total === 0) {
    return { total: 0, completed: 0, inProgress: 0, percentage: 0 };
  }
  const completed = flat.filter((c) => c.status === 'completed').length;
  const inProgress = flat.filter((c) => c.status === 'in_progress').length;
  return {
    total,
    completed,
    inProgress,
    percentage: Math.round((completed / total) * 100),
  };
}

export function getProgressColor(pct: number): string {
  if (pct >= 80) return 'from-emerald-500 to-emerald-600';
  if (pct >= 50) return 'from-blue-500 to-blue-600';
  if (pct >= 25) return 'from-amber-500 to-amber-600';
  return 'from-red-400 to-red-500';
}

// ─── Mutations de l'arbre des chapitres ───
// Chaque opération parcourt récursivement les sous-chapitres.

export function updateChapterInTree(
  chapters: SyllabusChapter[],
  id: string,
  field: EditableChapterField,
  value: string
): SyllabusChapter[] {
  return chapters.map((ch) => {
    if (ch.id === id) return { ...ch, [field]: value };
    if (ch.subchapters.length > 0) {
      return {
        ...ch,
        subchapters: updateChapterInTree(ch.subchapters, id, field, value),
      };
    }
    return ch;
  });
}

export function removeChapterFromTree(
  chapters: SyllabusChapter[],
  id: string
): SyllabusChapter[] {
  return chapters
    .filter((ch) => ch.id !== id)
    .map((ch) => ({
      ...ch,
      subchapters: removeChapterFromTree(ch.subchapters, id),
    }));
}

export function addSubchapterToTree(
  chapters: SyllabusChapter[],
  parentId: string
): SyllabusChapter[] {
  return chapters.map((ch) => {
    if (ch.id === parentId) {
      return {
        ...ch,
        subchapters: [
          ...ch.subchapters,
          createChapter('Sous-chapitre', ch.subchapters.length),
        ],
      };
    }
    if (ch.subchapters.length > 0) {
      return {
        ...ch,
        subchapters: addSubchapterToTree(ch.subchapters, parentId),
      };
    }
    return ch;
  });
}

export function cycleStatusInTree(
  chapters: SyllabusChapter[],
  id: string
): SyllabusChapter[] {
  return chapters.map((ch) => {
    if (ch.id === id) {
      const nextIdx = (STATUS_CYCLE.indexOf(ch.status) + 1) % STATUS_CYCLE.length;
      return { ...ch, status: STATUS_CYCLE[nextIdx] };
    }
    if (ch.subchapters.length > 0) {
      return {
        ...ch,
        subchapters: cycleStatusInTree(ch.subchapters, id),
      };
    }
    return ch;
  });
}

/** Conserve les chapitres dont le titre ou une note correspond, ainsi que leurs parents. */
export function filterChapterTree(
  chapters: SyllabusChapter[],
  searchTerm: string
): SyllabusChapter[] {
  if (!searchTerm.trim()) return chapters;
  const lower = searchTerm.toLowerCase();
  const filterTree = (nodes: SyllabusChapter[]): SyllabusChapter[] => {
    return nodes
      .filter((ch) => {
        const titleMatch = ch.title.toLowerCase().includes(lower);
        const noteMatch = ch.notes.toLowerCase().includes(lower);
        const subMatch = filterTree(ch.subchapters).length > 0;
        return titleMatch || noteMatch || subMatch;
      })
      .map((ch) => ({ ...ch, subchapters: filterTree(ch.subchapters) }));
  };
  return filterTree(chapters);
}
