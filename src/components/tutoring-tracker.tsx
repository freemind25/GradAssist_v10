"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Clock,
  Users,
  Star,
  BookOpen,
  GraduationCap,
  Timer,
  CheckCircle2,
  Trash2,
  Edit3,
  BarChart3,
  TrendingUp,
  Filter,
} from "lucide-react";
import type { TutoringSession, TutoringSessionType } from "@/types";
import { cn } from "@/lib/utils";

const SESSION_TYPES: { value: TutoringSessionType; label: string; color: string }[] = [
  { value: "cours", label: "Cours", color: "bg-blue-500" },
  { value: "td", label: "TD", color: "bg-emerald-500" },
  { value: "tp", label: "TP", color: "bg-purple-500" },
  { value: "rattrapage", label: "Rattrapage", color: "bg-orange-500" },
  { value: "prep_examen", label: "Prép. Examen", color: "bg-red-500" },
  { value: "methode", label: "Méthode", color: "bg-cyan-500" },
  { value: "autre", label: "Autre", color: "bg-gray-500" },
];

interface TutoringTrackerProps {
  studentNames: string[];
  sessions: TutoringSession[];
  onUpdate: (sessions: TutoringSession[]) => void;
}

const createEmptySession = (studentName: string): Omit<TutoringSession, "id"> => ({
  studentName,
  date: new Date().toISOString().split("T")[0],
  time: "09:00",
  duration: 60,
  sessionType: "cours",
  topic: "",
  objectives: "",
  materials: "",
  notes: "",
  progress: 0,
  rating: 3,
  completed: true,
});

export function TutoringTracker({ studentNames, sessions, onUpdate }: TutoringTrackerProps) {
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TutoringSession | null>(null);
  const [formData, setFormData] = useState<Partial<TutoringSession>>({});

  const stats = useMemo(() => {
    const filtered = filterStudent === "all" && filterType === "all"
      ? sessions
      : sessions.filter((s) => {
          if (filterStudent !== "all" && s.studentName !== filterStudent) return false;
          if (filterType !== "all" && s.sessionType !== filterType) return false;
          return true;
        });

    const totalHours = filtered.reduce((sum, s) => sum + s.duration, 0) / 60;
    const byType: Record<string, number> = {};
    const byStudent: Record<string, number> = {};
    let totalRating = 0;
    let completedCount = 0;

    filtered.forEach((s) => {
      byType[s.sessionType] = (byType[s.sessionType] || 0) + 1;
      byStudent[s.studentName] = (byStudent[s.studentName] || 0) + 1;
      totalRating += s.rating;
      if (s.completed) completedCount++;
    });

    return {
      totalSessions: filtered.length,
      totalHours: Math.round(totalHours * 10) / 10,
      byType: byType as Record<TutoringSessionType, number>,
      byStudent,
      avgRating: filtered.length > 0 ? Math.round((totalRating / filtered.length) * 10) / 10 : 0,
      avgDuration: filtered.length > 0 ? Math.round(filtered.reduce((s, se) => s + se.duration, 0) / filtered.length) : 0,
      completionRate: filtered.length > 0 ? Math.round((completedCount / filtered.length) * 100) : 0,
    };
  }, [sessions, filterStudent, filterType]);

  const filteredSessions = useMemo(() => {
    return [...sessions]
      .filter((s) => {
        if (filterStudent !== "all" && s.studentName !== filterStudent) return false;
        if (filterType !== "all" && s.sessionType !== filterType) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [sessions, filterStudent, filterType]);

  const openAddDialog = (studentName?: string) => {
    setFormData(createEmptySession(studentName || studentNames[0] || ""));
    setEditingSession(null);
    setIsAddOpen(true);
  };

  const openEditDialog = (session: TutoringSession) => {
    setFormData({ ...session });
    setEditingSession(session);
    setIsAddOpen(true);
  };

  const saveSession = () => {
    if (!formData.studentName || !formData.topic) return;

    if (editingSession) {
      onUpdate(sessions.map((s) => (s.id === editingSession.id ? { ...s, ...formData } as TutoringSession : s)));
    } else {
      const newSession: TutoringSession = {
        ...createEmptySession(formData.studentName || ""),
        ...formData,
        id: `tutoring_${Date.now()}`,
      } as TutoringSession;
      onUpdate([...sessions, newSession]);
    }
    setIsAddOpen(false);
    setEditingSession(null);
  };

  const deleteSession = (id: string) => {
    onUpdate(sessions.filter((s) => s.id !== id));
  };

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onChange?.(star)}
          disabled={!interactive}
          className={cn(
            "transition-colors",
            interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
          )}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <Card className="card-premium overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500/60 via-emerald-400 to-emerald-500/60" />
        <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-transparent pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Mission de Tutorat
              </CardTitle>
              <CardDescription>
                Suivi des séances de tutorat individuel avec les étudiants
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => openAddDialog()} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nouvelle séance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue placeholder="Étudiant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les étudiants</SelectItem>
                  {studentNames.filter(n => n.trim()).map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {SESSION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-500">{stats.totalSessions}</p>
              <p className="text-xs text-muted-foreground">Séances</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">{stats.totalHours}h</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <p className="text-2xl font-bold text-amber-500">{stats.avgRating}</p>
              </div>
              <p className="text-xs text-muted-foreground">Note moy.</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-500">{stats.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Complétées</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Sessions List ═══ */}
      {filteredSessions.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              {sessions.length === 0
                ? "Aucune séance de tutorat enregistrée"
                : "Aucune séance ne correspond aux filtres"}
            </p>
            {sessions.length === 0 && (
              <Button size="sm" className="mt-3 gap-1.5" onClick={() => openAddDialog()}>
                <Plus className="h-4 w-4" />
                Ajouter la première séance
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const typeInfo = SESSION_TYPES.find((t) => t.value === session.sessionType);
            return (
              <Card key={session.id} className="card-premium overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] text-white", typeInfo?.color)}
                        >
                          {typeInfo?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {session.date} à {session.time}
                        </span>
                        {session.completed && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{session.studentName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <BookOpen className="h-3 w-3 inline mr-1" />
                        {session.topic || "Non spécifié"}
                      </p>
                      {session.objectives && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          🎯 {session.objectives}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {session.duration} min
                        </span>
                        {renderStars(session.rating)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(session)}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Séance de {session.studentName} le {session.date}. Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSession(session.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ Stats par étudiant ═══ */}
      {Object.keys(stats.byStudent).length > 0 && (
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500/60 via-blue-400 to-blue-500/60" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistiques par étudiant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byStudent)
                .sort(([, a], [, b]) => b - a)
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="truncate">{name}</span>
                    <Badge variant="outline" className="text-xs">
                      {count} séance{count > 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Add/Edit Dialog ═══ */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? "Modifier la séance" : "Nouvelle séance de tutorat"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Étudiant */}
            <div className="grid gap-2">
              <Label>Étudiant *</Label>
              <Select
                value={formData.studentName || ""}
                onValueChange={(v) => setFormData({ ...formData, studentName: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un étudiant" />
                </SelectTrigger>
                <SelectContent>
                  {studentNames.filter(n => n.trim()).map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type de séance */}
            <div className="grid gap-2">
              <Label>Type de séance *</Label>
              <Select
                value={formData.sessionType || "cours"}
                onValueChange={(v) => setFormData({ ...formData, sessionType: v as TutoringSessionType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date et heure */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={formData.time || "09:00"}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            {/* Durée */}
            <div className="grid gap-2">
              <Label>Durée (minutes)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={formData.duration || 60}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">
                  ({Math.round(((formData.duration || 60) / 60) * 10) / 10}h)
                </span>
              </div>
            </div>

            {/* Sujet */}
            <div className="grid gap-2">
              <Label>Sujet / Chapitre *</Label>
              <Input
                value={formData.topic || ""}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Ex: Chapitre 3 - Méthodologie de recherche"
              />
            </div>

            {/* Objectifs */}
            <div className="grid gap-2">
              <Label>Objectifs de la séance</Label>
              <Textarea
                value={formData.objectives || ""}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                placeholder="Que doit maîtriser l'étudiant après cette séance ?"
                className="min-h-[60px]"
              />
            </div>

            {/* Supports */}
            <div className="grid gap-2">
              <Label>Supports utilisés</Label>
              <Input
                value={formData.materials || ""}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                placeholder="Ex: Diapositives, exercices pratiques, QCM"
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Notes libres</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observations, difficultés rencontrées, points à revoir..."
                className="min-h-[60px]"
              />
            </div>

            {/* Progression et Note */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Progression ({formData.progress || 0}%)</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={formData.progress || 0}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="grid gap-2">
                <Label>Note de la séance</Label>
                <div className="flex items-center gap-1 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                    >
                      <Star
                        className={cn(
                          "h-5 w-5 transition-colors hover:scale-110",
                          star <= (formData.rating || 3)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="completed"
                checked={formData.completed !== false}
                onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
                className="accent-emerald-500"
              />
              <Label htmlFor="completed" className="text-sm">Séance complétée</Label>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={saveSession} disabled={!formData.studentName || !formData.topic}>
              {editingSession ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
