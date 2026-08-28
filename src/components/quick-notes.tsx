"use client";

import { useState, useMemo } from "react";
import type { QuickNote, QuickNoteType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Plus, ThumbsUp, ThumbsDown, Minus, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickNotesProps {
  studentNames: string[];
  quickNotes: QuickNote[];
  onAddNote: (note: QuickNote) => void;
  onDeleteNote: (noteId: string) => void;
}

const NOTE_TYPES: { type: QuickNoteType; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { type: "positive", label: "Positif", icon: ThumbsUp, color: "text-emerald-600", bgColor: "bg-emerald-100 hover:bg-emerald-200" },
  { type: "negative", label: "Négatif", icon: ThumbsDown, color: "text-red-600", bgColor: "bg-red-100 hover:bg-red-200" },
  { type: "neutral", label: "Neutre", icon: Minus, color: "text-blue-600", bgColor: "bg-blue-100 hover:bg-blue-200" },
];

export function QuickNotes({ studentNames, quickNotes, onAddNote, onDeleteNote }: QuickNotesProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<QuickNoteType>("neutral");

  const validStudents = studentNames.filter((n) => n.trim());

  const handleAddNote = () => {
    if (!selectedStudent || !noteText.trim()) return;

    const newNote: QuickNote = {
      id: `qn_${Date.now()}`,
      studentName: selectedStudent,
      text: noteText.trim(),
      type: noteType,
      timestamp: new Date().toISOString(),
    };

    onAddNote(newNote);
    setNoteText("");
  };

  const notesByStudent = useMemo(() => {
    const grouped: Record<string, QuickNote[]> = {};
    for (const note of quickNotes) {
      if (!grouped[note.studentName]) {
        grouped[note.studentName] = [];
      }
      grouped[note.studentName].push(note);
    }
    // Sort notes by date (newest first)
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return grouped;
  }, [quickNotes]);

  const getNoteStyle = (type: QuickNoteType) => {
    switch (type) {
      case "positive":
        return "border-l-emerald-500 bg-emerald-50/50";
      case "negative":
        return "border-l-red-500 bg-red-50/50";
      default:
        return "border-l-blue-500 bg-blue-50/50";
    }
  };

  const getNoteIcon = (type: QuickNoteType) => {
    switch (type) {
      case "positive":
        return <ThumbsUp className="h-3 w-3 text-emerald-500" />;
      case "negative":
        return <ThumbsDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-blue-500" />;
    }
  };

  return (
    <Card className="card-premium overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-500/60 via-blue-500 to-blue-500/60" />
      <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          Notes rapides
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note form */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
          >
            <option value="">Choisir un étudiant...</option>
            {validStudents.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <div className="flex gap-1">
            {NOTE_TYPES.map((nt) => {
              const Icon = nt.icon;
              return (
                <button
                  key={nt.type}
                  onClick={() => setNoteType(nt.type)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    noteType === nt.type
                      ? `${nt.bgColor} ${nt.color}`
                      : "bg-muted hover:bg-muted/80"
                  )}
                  title={nt.label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>

          <Input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Note rapide..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          />

          <Button onClick={handleAddNote} disabled={!selectedStudent || !noteText.trim()} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Notes list by student */}
        {Object.keys(notesByStudent).length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune note rapide</p>
            <p className="text-xs mt-1">Ajoutez une note pour commencer le suivi</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {Object.entries(notesByStudent).map(([student, notes]) => (
              <div key={student} className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{student}</h4>
                <div className="space-y-1">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={cn(
                        "flex items-start gap-2 px-3 py-2 rounded-r-lg border-l-2 text-sm",
                        getNoteStyle(note.type)
                      )}
                    >
                      {getNoteIcon(note.type)}
                      <span className="flex-1">{note.text}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(note.timestamp).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
