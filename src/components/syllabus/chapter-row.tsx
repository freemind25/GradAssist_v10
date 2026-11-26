"use client";

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';
import type { SyllabusChapter } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  STATUS_CONFIG,
  type EditableChapterField,
} from '@/lib/syllabus';

/** Une ligne de chapitre, récursive pour les sous-chapitres. */
export function ChapterRow({
  chapter,
  depth,
  onUpdate,
  onRemove,
  onAddSub,
  onCycleStatus,
}: {
  chapter: SyllabusChapter;
  depth: number;
  onUpdate: (id: string, field: EditableChapterField, value: string) => void;
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
    <div className={cn('rounded-lg border transition-all duration-200', config.border, config.bg)}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => hasSub && setExpanded(!expanded)}
          className={cn(
            'shrink-0 p-0.5 rounded transition-colors',
            hasSub ? 'hover:bg-black/5 text-muted-foreground' : 'opacity-30'
          )}
        >
          {hasSub ? (
            expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>

        <span className={cn('shrink-0', config.color)}>
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
            className={cn(
              'flex-1 text-sm font-medium cursor-text',
              chapter.status === 'completed' && 'line-through opacity-70'
            )}
            onClick={() => setEditing(true)}
          >
            {chapter.title}
          </span>
        )}

        {/* Status cycle button */}
        <button
          onClick={() => onCycleStatus(chapter.id)}
          className={cn(
            'shrink-0 px-2 py-1 rounded-md text-xs font-medium transition-all hover:opacity-80',
            config.bg,
            config.color,
            'border',
            config.border
          )}
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
          onChange={(e) =>
            onUpdate(chapter.id, 'plannedEndDate', e.target.value)
          }
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
          {chapter.subchapters.map((sub) => (
            <ChapterRow
              key={sub.id}
              chapter={sub}
              depth={depth + 1}
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
