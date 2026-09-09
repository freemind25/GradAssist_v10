"use client";

import { useState, useMemo } from 'react';
import type { EvaluationData, ModuleType, SyllabusChapter, TutoringSession, TutoringSessionType, ThesisStudent } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Calendar, Clock, FileText, GraduationCap, Users,
  Download, CheckCircle2, AlertTriangle, BarChart3, TrendingUp,
  Circle, Timer, Star, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PedagogicalReportsProps {
  evaluationData: EvaluationData;
  moduleName: string;
  moduleType: ModuleType;
}

// ─── Flatten chapters ───
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

// ─── Compute syllabus progress ───
function computeSyllabusProgress(chapters: SyllabusChapter[]) {
  const flat = flattenChapters(chapters);
  const total = flat.length;
  if (total === 0) return { total: 0, completed: 0, inProgress: 0, notStarted: 0, percentage: 0, overdue: 0 };
  const completed = flat.filter(c => c.status === 'completed').length;
  const inProgress = flat.filter(c => c.status === 'in_progress').length;
  const notStarted = flat.filter(c => c.status === 'not_started').length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = flat.filter(c => c.plannedEndDate && c.status !== 'completed' && c.plannedEndDate < today).length;
  return { total, completed, inProgress, notStarted, percentage: Math.round((completed / total) * 100), overdue };
}

// ─── Tutoring stats ───
function computeTutoringStats(sessions: TutoringSession[]) {
  if (sessions.length === 0) return null;
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
  const avgRating = Math.round(sessions.reduce((sum, s) => sum + s.rating, 0) / totalSessions * 10) / 10;
  const avgDuration = Math.round(totalMinutes / totalSessions);
  const completed = sessions.filter(s => s.completed).length;
  const byType: Record<string, number> = {};
  const byStudent: Record<string, number> = {};
  for (const s of sessions) {
    byType[s.sessionType] = (byType[s.sessionType] || 0) + 1;
    byStudent[s.studentName] = (byStudent[s.studentName] || 0) + 1;
  }
  return { totalSessions, totalHours, avgRating, avgDuration, completed, completionRate: Math.round((completed / totalSessions) * 100), byType, byStudent };
}

// ─── Tutoring type labels ───
const TUTORING_TYPE_LABELS: Record<TutoringSessionType, string> = {
  cours: 'Cours', td: 'TD', tp: 'TP', rattrapage: 'Rattrapage',
  prep_examen: 'Préparation Examen', methode: 'Méthode', autre: 'Autre',
};

// ─── Supervision stats ───
function computeSupervisionStats(students: ThesisStudent[]) {
  if (students.length === 0) return null;
  const total = students.length;
  const inProgress = students.filter(s => s.status === 'en cours').length;
  const inRedaction = students.filter(s => s.status === 'en rédaction').length;
  const defended = students.filter(s => s.status === 'soutenu').length;
  const abandoned = students.filter(s => s.status === 'abandonné').length;
  const avgProgress = Math.round(students.reduce((sum, s) => sum + s.progress, 0) / total);
  return { total, inProgress, inRedaction, defended, abandoned, avgProgress };
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  cours: 'Cours', td: 'TD', tp: 'TP', rattrapage: 'Rattrapage',
  prep_examen: 'Prép. Examen', methode: 'Méthode', autre: 'Autre',
};

export function PedagogicalReports({ evaluationData, moduleName, moduleType }: PedagogicalReportsProps) {
  const [activeReport, setActiveReport] = useState<'course' | 'supervision'>('course');

  const syllabus = evaluationData.syllabus;
  const chapters = syllabus?.chapters ?? [];
  const progress = useMemo(() => computeSyllabusProgress(chapters), [chapters]);
  const tutoringSessions = evaluationData.tutoringSessions ?? [];
  const tutoringStats = useMemo(() => computeTutoringStats(tutoringSessions), [tutoringSessions]);
  const thesisStudents = evaluationData.thesisStudents ?? [];
  const supervisionStats = useMemo(() => computeSupervisionStats(thesisStudents), [thesisStudents]);

  // ─── Attendance stats ───
  const attendanceStats = useMemo(() => {
    const attendance = evaluationData.attendance ?? {};
    const dates = Object.keys(attendance);
    if (dates.length === 0) return null;
    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalExcused = 0;
    for (const date of dates) {
      const rec = attendance[date];
      for (const status of Object.values(rec)) {
        if (status === 'present') totalPresent++;
        else if (status === 'absent') totalAbsent++;
        else if (status === 'late') totalLate++;
        else if (status === 'excused') totalExcused++;
      }
    }
    const total = totalPresent + totalAbsent + totalLate + totalExcused;
    return {
      totalSessions: dates.length,
      totalPresent, totalAbsent, totalLate, totalExcused,
      total,
      attendanceRate: total > 0 ? Math.round((totalPresent / total) * 100) : 0,
    };
  }, [evaluationData.attendance]);

  const handleExportReport = async (reportType: string) => {
    let content = '';
    const now = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const defaultFileName = `Rapport_${reportType === 'course' ? 'Cours' : 'Encadrement'}_${moduleName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;

    if (reportType === 'course') {
      content = `RAPPORT DE SUIVI PÉDAGOGIQUE\n`;
      content += `===========================\n\n`;
      content += `Module : ${moduleName}\n`;
      content += `Type : ${moduleType === 'atelier' ? 'Atelier' : moduleType === 'mooc' ? 'MOOC' : 'Matière Classique'}\n`;
      content += `Date du rapport : ${now}\n`;
      content += `Année académique : ${evaluationData.academicYear || 'Non définie'}\n`;
      content += `Université : ${evaluationData.universityName || 'Non définie'}\n`;
      content += `Département : ${evaluationData.departmentName || 'Non définie'}\n\n`;
      content += `--- SUIVI DU CANEVAS ---\n\n`;
      content += `Avancement global : ${progress.percentage}% (${progress.completed}/${progress.total} chapitres)\n`;
      content += `En cours : ${progress.inProgress}\n`;
      content += `Non commencés : ${progress.notStarted}\n`;
      content += `En retard : ${progress.overdue}\n\n`;

      const flat = flattenChapters(chapters);
      if (flat.length > 0) {
        content += `DÉTAIL DES CHAPITRES :\n`;
        for (const ch of flat) {
          const statusLabel = ch.status === 'completed' ? '✓ Terminé' : ch.status === 'in_progress' ? '● En cours' : '○ Non commencé';
          const overdue = ch.plannedEndDate && ch.status !== 'completed' && ch.plannedEndDate < new Date().toISOString().slice(0, 10);
          content += `  ${ch.title} — ${statusLabel}${overdue ? ' ⚠ EN RETARD' : ''}`;
          if (ch.plannedDate) content += ` (${ch.plannedDate}${ch.plannedEndDate ? ' → ' + ch.plannedEndDate : ''})`;
          content += '\n';
          if (ch.notes) content += `    Notes: ${ch.notes}\n`;
        }
      }

      if (attendanceStats) {
        content += `\n--- PRÉSENCES ---\n\n`;
        content += `Nombre de séances : ${attendanceStats.totalSessions}\n`;
        content += `Taux de présence : ${attendanceStats.attendanceRate}%\n`;
        content += `Présents : ${attendanceStats.totalPresent} | Absents : ${attendanceStats.totalAbsent} | Retards : ${attendanceStats.totalLate} | Excusés : ${attendanceStats.totalExcused}\n`;
      }

      if (moduleType === 'atelier') {
        content += `\n--- ÉVALUATION ---\n\n`;
        content += `Note totale : ${evaluationData.totalPoints}\n`;
        content += `Nombre de critères : ${evaluationData.criteria.length}\n`;
      } else {
        content += `\n--- ÉVALUATION ---\n\n`;
        content += `Note CC : ${evaluationData.continuousAssessmentGrade ?? 'N/A'}/20\n`;
        content += `Note Examen : ${evaluationData.examGrade ?? 'N/A'}/20\n`;
        content += `Pondération CC : ${evaluationData.continuousAssessmentWeight ?? 40}%\n`;
      }
    } else if (reportType === 'supervision') {
      content = `RAPPORT D'ENCADREMENT ET TUTORAT\n`;
      content += `=================================\n\n`;
      content += `Module : ${moduleName}\n`;
      content += `Date du rapport : ${now}\n\n`;

      if (supervisionStats) {
        content += `--- ENCADREMENT (MÉMOIRES) ---\n\n`;
        content += `Total étudiants encadrés : ${supervisionStats.total}\n`;
        content += `En cours : ${supervisionStats.inProgress}\n`;
        content += `En rédaction : ${supervisionStats.inRedaction}\n`;
        content += `Soutenus : ${supervisionStats.defended}\n`;
        content += `Abandonnés : ${supervisionStats.abandoned}\n`;
        content += `Avancement moyen : ${supervisionStats.avgProgress}%\n\n`;
        content += `DÉTAIL :\n`;
        for (const s of thesisStudents) {
          content += `  ${s.firstName} ${s.lastName} — ${s.status} (${s.progress}%) — ${s.title || 'Sans titre'}\n`;
          content += `    Directeur: ${s.advisor || 'N/A'} | Co-encadrant: ${s.coAdvisor || 'N/A'}\n`;
          if (s.events.length > 0) {
            content += `    Événements : ${s.events.length}\n`;
          }
        }
      } else {
        content += `Aucun étudiant encadré enregistré.\n`;
      }

      if (tutoringStats) {
        content += `\n--- TUTORAT ---\n\n`;
        content += `Total séances : ${tutoringStats.totalSessions}\n`;
        content += `Durée totale : ${tutoringStats.totalHours}h\n`;
        content += `Note moyenne : ${tutoringStats.avgRating}/5\n`;
        content += `Durée moyenne : ${tutoringStats.avgDuration} min\n`;
        content += `Taux de complétion : ${tutoringStats.completionRate}%\n\n`;
        content += `PAR TYPE :\n`;
        for (const [type, count] of Object.entries(tutoringStats.byType)) {
          content += `  ${SESSION_TYPE_LABELS[type] || type} : ${count} séance(s)\n`;
        }
        content += `\nPAR ÉTUDIANT :\n`;
        for (const [student, count] of Object.entries(tutoringStats.byStudent)) {
          content += `  ${student} : ${count} séance(s)\n`;
        }
        content += `\nDÉTAIL DES SÉANCES :\n`;
        for (const s of tutoringSessions) {
          content += `  ${s.date} ${s.time} — ${s.studentName} — ${SESSION_TYPE_LABELS[s.sessionType] || s.sessionType}\n`;
          content += `    Sujet: ${s.topic || 'N/A'} | Durée: ${s.duration}min | Note: ${s.rating}/5 | ${s.completed ? '✓ Complétée' : '● En cours'}\n`;
          if (s.objectives) content += `    Objectifs: ${s.objectives}\n`;
          if (s.notes) content += `    Notes: ${s.notes}\n`;
        }
      } else {
        content += `\nAucune séance de tutorat enregistrée.\n`;
      }
    }

    // Try File System Access API (PC/desktop) for native save-as dialog
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFileName,
          types: [
            {
              description: 'Fichier texte',
              accept: { 'text/plain': ['.txt'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(new Blob([content], { type: 'text/plain;charset=utf-8' }));
        await writable.close();
        return;
      } catch (err: any) {
        // User cancelled the dialog — do nothing
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback: auto-download (mobile, Electron, browsers without API)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveReport('course')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeReport === 'course'
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Suivi Cours / Canevas
        </button>
        <button
          onClick={() => setActiveReport('supervision')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeReport === 'supervision'
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          <GraduationCap className="h-4 w-4" />
          Encadrement & Tutorat
        </button>
      </div>

      {/* ═══ REPORT 1: Course / Canevas Progress ═══ */}
      {activeReport === 'course' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold">{progress.percentage}%</p>
                    <p className="text-xs text-muted-foreground">Avancement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-emerald-600">{progress.completed}</p>
                    <p className="text-xs text-muted-foreground">Terminés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-blue-600">{progress.inProgress}</p>
                    <p className="text-xs text-muted-foreground">En cours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", progress.overdue > 0 ? "bg-red-100" : "bg-muted")}>
                    <AlertTriangle className={cn("h-5 w-5", progress.overdue > 0 ? "text-red-600" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-extrabold", progress.overdue > 0 ? "text-red-600" : "")}>{progress.overdue}</p>
                    <p className="text-xs text-muted-foreground">En retard</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="card-premium overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/60 via-accent to-primary/60" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Avancement du Programme — {moduleName}
              </CardTitle>
              <CardDescription>
                Suivi de l&apos;avancement des cours, TD et atelier par rapport au programme du canevas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.total === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun chapitre défini dans le canevas.</p>
                  <p className="text-xs mt-1">Ajoutez des chapitres dans l&apos;onglet Canevas pour suivre l&apos;avancement.</p>
                </div>
              ) : (
                <>
                  {/* Main progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Avancement global</span>
                      <span className="font-bold text-primary">{progress.percentage}%</span>
                    </div>
                    <div className="relative h-4 bg-border rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.completed} terminé(s)</span>
                      <span>{progress.inProgress} en cours</span>
                      <span>{progress.notStarted} non commencé(s)</span>
                    </div>
                  </div>

                  {/* Chapter detail table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[1fr_120px_120px_100px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                      <span>Chapitre</span>
                      <span>Début prévu</span>
                      <span>Fin prévue</span>
                      <span>Statut</span>
                    </div>
                    {flattenChapters(chapters).map((ch) => {
                      const isOverdue = ch.plannedEndDate && ch.status !== 'completed' && ch.plannedEndDate < new Date().toISOString().slice(0, 10);
                      return (
                        <div key={ch.id} className={cn("grid grid-cols-[1fr_120px_120px_100px] gap-2 px-3 py-2 border-t text-sm items-center", isOverdue && "bg-red-50/50")}>
                          <span className={cn("font-medium", ch.status === 'completed' && "line-through opacity-60")}>
                            {ch.title}
                          </span>
                          <span className="text-xs">{ch.plannedDate || '—'}</span>
                          <span className={cn("text-xs", isOverdue && "text-destructive font-medium")}>
                            {ch.plannedEndDate || '—'}{isOverdue && ' ⚠️'}
                          </span>
                          <span className={cn("text-xs font-medium",
                            ch.status === 'completed' ? "text-emerald-600" :
                            ch.status === 'in_progress' ? "text-blue-600" : "text-muted-foreground"
                          )}>
                            {ch.status === 'completed' ? '✓ Terminé' : ch.status === 'in_progress' ? '● En cours' : '○ Non commencé'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Attendance summary */}
              {attendanceStats && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Synthèse des Présences
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-lg font-extrabold">{attendanceStats.totalSessions}</p>
                      <p className="text-xs text-muted-foreground">Séances</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <p className="text-lg font-extrabold text-emerald-600">{attendanceStats.attendanceRate}%</p>
                      <p className="text-xs text-muted-foreground">Présence</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-lg font-extrabold text-emerald-600">{attendanceStats.totalPresent}</p>
                      <p className="text-xs text-muted-foreground">Présents</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-lg font-extrabold text-red-600">{attendanceStats.totalAbsent}</p>
                      <p className="text-xs text-muted-foreground">Absents</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-lg font-extrabold text-amber-600">{attendanceStats.totalLate}</p>
                      <p className="text-xs text-muted-foreground">Retards</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button onClick={() => handleExportReport('course')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Enregistrer le rapport de suivi
            </Button>
          </div>
        </div>
      )}

      {/* ═══ REPORT 2: Supervision & Tutoring ═══ */}
      {activeReport === 'supervision' && (
        <div className="space-y-6">
          {/* Supervision Section */}
          <Card className="card-premium overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-500 via-primary to-purple-500" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Suivi de l&apos;Encadrement
              </CardTitle>
              <CardDescription>
                État des mémoires et thèses sous votre supervision.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!supervisionStats ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun étudiant encadré enregistré.</p>
                  <p className="text-xs mt-1">Ajoutez des étudiants dans l&apos;onglet Encadrement.</p>
                </div>
              ) : (
                <>
                  {/* Stats cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-lg font-extrabold">{supervisionStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-extrabold text-blue-600">{supervisionStats.inProgress}</p>
                      <p className="text-xs text-muted-foreground">En cours</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <p className="text-lg font-extrabold text-amber-600">{supervisionStats.inRedaction}</p>
                      <p className="text-xs text-muted-foreground">Rédaction</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <p className="text-lg font-extrabold text-emerald-600">{supervisionStats.defended}</p>
                      <p className="text-xs text-muted-foreground">Soutenus</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-lg font-extrabold">{supervisionStats.avgProgress}%</p>
                      <p className="text-xs text-muted-foreground">Avanc. moyen</p>
                    </div>
                  </div>

                  {/* Student detail list */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[1fr_100px_80px_1fr] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                      <span>Étudiant</span>
                      <span>Statut</span>
                      <span>Avancement</span>
                      <span>Directeur</span>
                    </div>
                    {thesisStudents.map((s) => (
                      <div key={s.id} className="grid grid-cols-[1fr_100px_80px_1fr] gap-2 px-3 py-2 border-t text-sm items-center">
                        <div>
                          <p className="font-medium">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.title || 'Sans titre'}</p>
                        </div>
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                          s.status === 'soutenu' ? "bg-emerald-100 text-emerald-700" :
                          s.status === 'en rédaction' ? "bg-amber-100 text-amber-700" :
                          s.status === 'abandonné' ? "bg-red-100 text-red-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {s.status}
                        </span>
                        <div>
                          <div className="h-2 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${s.progress}%` }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{s.progress}%</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{s.advisor || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tutoring Section */}
          <Card className="card-premium overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-primary to-amber-500" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-amber-600" />
                Suivi du Tutorat
              </CardTitle>
              <CardDescription>
                Statistiques et détails des séances de tutorat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!tutoringStats ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Timer className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucune séance de tutorat enregistrée.</p>
                  <p className="text-xs mt-1">Ajoutez des séances dans l&apos;onglet Tutorat.</p>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-lg font-extrabold">{tutoringStats.totalSessions}</p>
                      <p className="text-xs text-muted-foreground">Séances</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-lg font-extrabold">{tutoringStats.totalHours}h</p>
                      <p className="text-xs text-muted-foreground">Durée totale</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <p className="text-lg font-extrabold text-amber-600">{tutoringStats.avgRating}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Note moy.</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <p className="text-lg font-extrabold text-emerald-600">{tutoringStats.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">Complétées</p>
                    </div>
                  </div>

                  {/* By type breakdown */}
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Répartition par type de séance
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(tutoringStats.byType).map(([type, count]) => (
                        <div key={type} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="text-sm font-medium">{SESSION_TYPE_LABELS[type] || type}</span>
                          <span className="text-sm text-muted-foreground ml-auto">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* By student breakdown */}
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Nombre de séances par étudiant
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(tutoringStats.byStudent)
                        .sort(([, a], [, b]) => b - a)
                        .map(([student, count]) => (
                          <div key={student} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                            <span className="text-sm font-medium truncate">{student}</span>
                            <span className="text-sm text-primary font-bold">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Recent sessions */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Dernières séances
                    </div>
                    {tutoringSessions.slice(-5).reverse().map((s) => (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2 border-t text-sm">
                        <span className="text-xs text-muted-foreground w-20 shrink-0">{s.date}</span>
                        <span className="font-medium truncate">{s.studentName}</span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full shrink-0",
                          s.sessionType === 'cours' ? "bg-blue-100 text-blue-700" :
                          s.sessionType === 'td' ? "bg-purple-100 text-purple-700" :
                          s.sessionType === 'tp' ? "bg-amber-100 text-amber-700" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {SESSION_TYPE_LABELS[s.sessionType] || s.sessionType}
                        </span>
                        <span className="text-xs text-muted-foreground">{s.duration}min</span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("h-3 w-3", i < s.rating ? "text-amber-500 fill-amber-500" : "text-muted")} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button onClick={() => handleExportReport('supervision')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Enregistrer le rapport d&apos;encadrement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
