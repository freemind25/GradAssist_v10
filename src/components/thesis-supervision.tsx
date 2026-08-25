"use client";

import { useState, useMemo } from "react";
import type { ThesisStudent, SupervisionEvent, EventType } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  GraduationCap,
  Mail,
  MinusCircle,
  PlusCircle,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThesisSupervisionProps {
  thesisStudents: ThesisStudent[];
  setThesisStudents: (students: ThesisStudent[]) => void;
}

/* ── Constants ──────────────────────────────────────────────────── */

const STATUS_OPTIONS: ThesisStudent["status"][] = [
  "en cours",
  "en rédaction",
  "soutenu",
  "abandonné",
];

const STATUS_COLORS: Record<ThesisStudent["status"], string> = {
  "en cours": "bg-blue-100 text-blue-700 border-blue-200",
  "en rédaction": "bg-amber-100 text-amber-700 border-amber-200",
  soutenu: "bg-emerald-100 text-emerald-700 border-emerald-200",
  abandonné: "bg-red-100 text-red-700 border-red-200",
};

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: typeof Calendar; color: string; badge: string }> = {
  consultation:     { label: "Consultation",         icon: Clock,          color: "text-blue-600",   badge: "bg-blue-100 text-blue-700 border-blue-200" },
  chapter_deadline: { label: "Remise de chapitre",   icon: CalendarClock,  color: "text-amber-600",  badge: "bg-amber-100 text-amber-700 border-amber-200" },
  meeting:          { label: "Réunion",              icon: Calendar,       color: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  review:           { label: "Revue / Correction",   icon: BookOpen,       color: "text-purple-600", badge: "bg-purple-100 text-purple-700 border-purple-200" },
  reminder:         { label: "Rappel",               icon: Send,           color: "text-orange-600", badge: "bg-orange-100 text-orange-700 border-orange-200" },
  other:            { label: "Autre",                icon: PlusCircle,     color: "text-gray-600",   badge: "bg-gray-100 text-gray-700 border-gray-200" },
};

const EVENT_TYPE_OPTIONS: EventType[] = ["consultation", "chapter_deadline", "meeting", "review", "reminder", "other"];

const PROGRESS_COLORS = [
  { threshold: 80, bar: "from-emerald-400 to-emerald-600", bg: "bg-emerald-50" },
  { threshold: 50, bar: "from-amber-400 to-amber-600", bg: "bg-amber-50" },
  { threshold: 25, bar: "from-orange-400 to-orange-600", bg: "bg-orange-50" },
  { threshold: 0, bar: "from-red-400 to-red-600", bg: "bg-red-50" },
];

function getProgressColor(pct: number) {
  for (const c of PROGRESS_COLORS) {
    if (pct >= c.threshold) return c;
  }
  return PROGRESS_COLORS[PROGRESS_COLORS.length - 1];
}

function createEmptyStudent(): ThesisStudent {
  return {
    id: `thesis_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    firstName: "",
    lastName: "",
    title: "",
    advisor: "",
    coAdvisor: "",
    progress: 0,
    status: "en cours",
    startDate: "",
    defenseDate: "",
    description: "",
    keywords: "",
    events: [],
    email: "",
  };
}

function createEmptyEvent(): SupervisionEvent {
  return {
    id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: "",
    type: "consultation",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    description: "",
    completed: false,
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function isPast(dateStr: string, timeStr: string): boolean {
  const now = new Date();
  const eventDate = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
  return eventDate < now;
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

function isThisWeek(dateStr: string): boolean {
  const now = new Date();
  const eventDate = new Date(dateStr + "T00:00:00");
  const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

/* ── Component ──────────────────────────────────────────────────── */

export function ThesisSupervision({ thesisStudents, setThesisStudents }: ThesisSupervisionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    thesisStudents.length === 1 ? thesisStudents[0].id : null,
  );
  const [activeSubTab, setActiveSubTab] = useState<"info" | "calendar" | "email">("info");

  const updateStudent = (id: string, field: keyof ThesisStudent, value: unknown) => {
    setThesisStudents(
      thesisStudents.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const addStudent = () => {
    const newStudent = createEmptyStudent();
    setThesisStudents([...thesisStudents, newStudent]);
    setExpandedId(newStudent.id);
    setActiveSubTab("info");
  };

  const removeStudent = (id: string) => {
    if (thesisStudents.length <= 1) return;
    const updated = thesisStudents.filter((s) => s.id !== id);
    setThesisStudents(updated);
    if (expandedId === id) setExpandedId(null);
  };

  /* ── Event helpers ── */

  const addEvent = (studentId: string) => {
    const student = thesisStudents.find((s) => s.id === studentId);
    if (!student) return;
    const newEvent = createEmptyEvent();
    updateStudent(studentId, "events", [...(student.events ?? []), newEvent]);
  };

  const updateEvent = (studentId: string, eventId: string, field: keyof SupervisionEvent, value: string | boolean) => {
    const student = thesisStudents.find((s) => s.id === studentId);
    if (!student) return;
    const events = (student.events ?? []).map((e) =>
      e.id === eventId ? { ...e, [field]: value } : e,
    );
    updateStudent(studentId, "events", events);
  };

  const removeEvent = (studentId: string, eventId: string) => {
    const student = thesisStudents.find((s) => s.id === studentId);
    if (!student) return;
    const events = (student.events ?? []).filter((e) => e.id !== eventId);
    updateStudent(studentId, "events", events);
  };

  /* ── Email helpers ── */

  const sendEmail = (student: ThesisStudent, subject: string, body: string) => {
    const email = student.email || "";
    const studentName = [student.firstName, student.lastName].filter(Boolean).join(" ");
    const encodedSubject = encodeURIComponent(subject.replace("{etudiant}", studentName));
    const encodedBody = encodeURIComponent(body.replace("{etudiant}", studentName).replace("{titre}", student.title || ""));
    const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
    window.open(mailtoUrl, "_blank");
  };

  /* ── Computed data ── */

  // All upcoming events across all students, sorted by date
  const allUpcomingEvents = useMemo(() => {
    const events: (SupervisionEvent & { studentName: string; studentId: string })[] = [];
    thesisStudents.forEach((s) => {
      const name = [s.firstName, s.lastName].filter(Boolean).join(" ") || "Étudiant";
      (s.events ?? []).forEach((e) => {
        if (!e.completed) {
          events.push({ ...e, studentName: name, studentId: s.id });
        }
      });
    });
    return events.sort((a, b) => {
      const da = `${a.date}T${a.time || "00:00"}`;
      const db = `${b.date}T${b.time || "00:00"}`;
      return da.localeCompare(db);
    });
  }, [thesisStudents]);

  const upcomingCount = allUpcomingEvents.length;
  const todayEvents = allUpcomingEvents.filter((e) => isToday(e.date));
  const thisWeekEvents = allUpcomingEvents.filter((e) => isThisWeek(e.date) && !isToday(e.date));

  /* ── Sub-tab buttons for expanded student ── */

  const subTabs = [
    { id: "info" as const, label: "Informations", icon: BookOpen },
    { id: "calendar" as const, label: "Agenda", icon: Calendar, badge: upcomingCount > 0 ? upcomingCount : undefined },
    { id: "email" as const, label: "Messages", icon: Mail },
  ];

  return (
    <div className="space-y-4">
      {/* ═══ Global Calendar Overview ═══ */}
      {upcomingCount > 0 && (
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-primary to-blue-500" />
          <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Agenda à venir
              <Badge variant="outline" className="ml-2 text-[10px] bg-primary/10 text-primary border-primary/30">
                {upcomingCount} événement{upcomingCount > 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Today */}
            {todayEvents.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Aujourd&apos;hui
                </p>
                <div className="space-y-1.5">
                  {todayEvents.map((e) => {
                    const cfg = EVENT_TYPE_CONFIG[e.type];
                    const Icon = cfg.icon;
                    return (
                      <div key={e.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
                        <span className="text-xs font-medium text-foreground truncate">{e.title || cfg.label}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{e.time}</span>
                        <span className="text-[10px] text-primary font-medium shrink-0">→ {e.studentName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* This week */}
            {thisWeekEvents.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Cette semaine
                </p>
                <div className="space-y-1.5">
                  {thisWeekEvents.slice(0, 5).map((e) => {
                    const cfg = EVENT_TYPE_CONFIG[e.type];
                    const Icon = cfg.icon;
                    return (
                      <div key={e.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 border border-border/40">
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
                        <span className="text-xs font-medium truncate">{e.title || cfg.label}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(e.date)} {e.time}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">→ {e.studentName}</span>
                      </div>
                    );
                  })}
                  {thisWeekEvents.length > 5 && (
                    <p className="text-[10px] text-muted-foreground pl-3">+ {thisWeekEvents.length - 5} autres cette semaine</p>
                  )}
                </div>
              </div>
            )}

            {todayEvents.length === 0 && thisWeekEvents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">Aucun événement à venir cette semaine.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ Student Cards ═══ */}
      <Card className="card-premium overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Encadrement &amp; Mémoires
          </CardTitle>
          <CardDescription>
            Suivez l&apos;avancement des étudiants, planifiez des consultations et envoyez des messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {thesisStudents.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Aucun étudiant encadré. Cliquez sur « Ajouter un étudiant » pour commencer.
            </div>
          )}

          {thesisStudents.map((student, index) => {
            const isExpanded = expandedId === student.id;
            const pct = Math.min(Math.max(student.progress, 0), 100);
            const pColor = getProgressColor(pct);
            const fullName = [student.lastName, student.firstName].filter(Boolean).join(" ") || `Étudiant ${index + 1}`;
            const studentEvents = student.events ?? [];
            const pendingEvents = studentEvents.filter((e) => !e.completed);
            const completedEvents = studentEvents.filter((e) => e.completed);

            return (
              <div
                key={student.id}
                className={cn(
                  "rounded-xl border transition-all duration-200",
                  isExpanded ? "border-primary/30 shadow-md" : "border-border/60 hover:border-border",
                )}
              >
                {/* ── Collapsed header ── */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{fullName}</span>
                      {student.title && (
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">— {student.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", pColor.bar)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground w-9 text-right">{pct}%</span>
                    </div>
                  </div>

                  <Badge variant="outline" className={cn("text-[10px] shrink-0", STATUS_COLORS[student.status])}>
                    {student.status}
                  </Badge>

                  {pendingEvents.length > 0 && (
                    <Badge variant="outline" className="text-[10px] shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                      <Calendar className="h-2.5 w-2.5 mr-1" />
                      {pendingEvents.length}
                    </Badge>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setExpandedId(isExpanded ? null : student.id); setActiveSubTab("info"); }}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {thesisStudents.length > 1 && (
                      <button
                        onClick={() => removeStudent(student.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <MinusCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Expanded content ── */}
                {isExpanded && (
                  <div className="border-t border-border/40">
                    {/* Sub-tabs */}
                    <div className="flex gap-1 px-4 pt-3 pb-1">
                      {subTabs.map((tab) => {
                        const TabIcon = tab.icon;
                        const isActive = activeSubTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <TabIcon className="h-3 w-3" />
                            {tab.label}
                            {tab.badge && (
                              <span className="ml-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[9px] font-bold px-1">
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="px-4 pb-4 pt-2 space-y-4">
                      {/* ═══ Sub-tab: Informations ═══ */}
                      {activeSubTab === "info" && (
                        <>
                          {/* Name */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Nom *</label>
                              <input
                                value={student.lastName}
                                onChange={(e) => updateStudent(student.id, "lastName", e.target.value)}
                                placeholder="Nom de famille"
                                className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Prénom *</label>
                              <input
                                value={student.firstName}
                                onChange={(e) => updateStudent(student.id, "firstName", e.target.value)}
                                placeholder="Prénom"
                                className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                              />
                            </div>
                          </div>

                          {/* Email */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> Email de l&apos;étudiant
                            </label>
                            <input
                              type="email"
                              value={student.email ?? ""}
                              onChange={(e) => updateStudent(student.id, "email", e.target.value)}
                              placeholder="etudiant@universite.dz"
                              className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            />
                          </div>

                          {/* Title */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Titre du mémoire *</label>
                            <input
                              value={student.title}
                              onChange={(e) => updateStudent(student.id, "title", e.target.value)}
                              placeholder="Titre complet du mémoire"
                              className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            />
                          </div>

                          {/* Advisors */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Directeur de mémoire</label>
                              <input
                                value={student.advisor}
                                onChange={(e) => updateStudent(student.id, "advisor", e.target.value)}
                                placeholder="Nom du directeur"
                                className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Co-encadrant</label>
                              <input
                                value={student.coAdvisor}
                                onChange={(e) => updateStudent(student.id, "coAdvisor", e.target.value)}
                                placeholder="Nom du co-encadrant"
                                className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                              />
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Date de début
                              </label>
                              <input
                                type="date"
                                value={student.startDate}
                                onChange={(e) => updateStudent(student.id, "startDate", e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Date de soutenance prévue
                              </label>
                              <input
                                type="date"
                                value={student.defenseDate}
                                onChange={(e) => updateStudent(student.id, "defenseDate", e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                              />
                            </div>
                          </div>

                          {/* Status + Progress */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Statut</label>
                              <select
                                value={student.status}
                                onChange={(e) => updateStudent(student.id, "status", e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Avancement — {student.progress}%
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={5}
                                  value={student.progress}
                                  onChange={(e) => updateStudent(student.id, "progress", parseInt(e.target.value))}
                                  className="flex-1 h-2 accent-primary cursor-pointer"
                                />
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={student.progress}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                    updateStudent(student.id, "progress", val);
                                  }}
                                  className="w-16 h-9 px-2 rounded-lg border border-border/60 bg-background text-sm text-center focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                              <div className="h-2.5 bg-muted rounded-full overflow-hidden mt-1">
                                <div
                                  className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", pColor.bar)}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Keywords */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Mots-clés</label>
                            <input
                              value={student.keywords}
                              onChange={(e) => updateStudent(student.id, "keywords", e.target.value)}
                              placeholder="Mots-clés séparés par des virgules"
                              className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Description / Notes</label>
                            <textarea
                              value={student.description}
                              onChange={(e) => updateStudent(student.id, "description", e.target.value)}
                              placeholder="Résumé du sujet, objectifs, problématique, observations…"
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-y"
                            />
                          </div>
                        </>
                      )}

                      {/* ═══ Sub-tab: Agenda ═══ */}
                      {activeSubTab === "calendar" && (
                        <>
                          {/* Event form */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold flex items-center gap-2">
                                <CalendarClock className="h-4 w-4 text-primary" />
                                Événements
                              </h4>
                              <Button
                                onClick={() => addEvent(student.id)}
                                variant="outline"
                                size="sm"
                                className="border-dashed h-8 text-xs"
                              >
                                <PlusCircle className="h-3 w-3 mr-1" />
                                Ajouter
                              </Button>
                            </div>

                            {studentEvents.length === 0 && (
                              <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-lg">
                                <Calendar className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                                Aucun événement planifié.
                                <br />Ajoutez des consultations, des remises de chapitres, etc.
                              </div>
                            )}

                            <div className="space-y-2">
                              {studentEvents
                                .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
                                .map((event) => {
                                  const cfg = EVENT_TYPE_CONFIG[event.type];
                                  const Icon = cfg.icon;
                                  const past = isPast(event.date, event.time);
                                  const today = isToday(event.date);

                                  return (
                                    <div
                                      key={event.id}
                                      className={cn(
                                        "rounded-lg border p-3 space-y-2 transition-all",
                                        event.completed
                                          ? "border-emerald-200 bg-emerald-50/50 opacity-60"
                                          : past
                                            ? "border-orange-200 bg-orange-50/30"
                                            : today
                                              ? "border-primary/30 bg-primary/5"
                                              : "border-border/60 bg-background",
                                      )}
                                    >
                                      {/* Event header row */}
                                      <div className="flex items-center gap-2">
                                        {/* Completed checkbox */}
                                        <button
                                          onClick={() => updateEvent(student.id, event.id, "completed", !event.completed)}
                                          className={cn(
                                            "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                                            event.completed
                                              ? "bg-emerald-500 border-emerald-500 text-white"
                                              : "border-border/60 hover:border-primary/40",
                                          )}
                                        >
                                          {event.completed && <CheckCircle2 className="h-3 w-3" />}
                                        </button>

                                        {/* Title */}
                                        <input
                                          value={event.title}
                                          onChange={(e) => updateEvent(student.id, event.id, "title", e.target.value)}
                                          placeholder="Titre de l'événement"
                                          className={cn(
                                            "flex-1 h-7 px-2 rounded border-0 bg-transparent text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none",
                                            event.completed && "line-through text-muted-foreground",
                                          )}
                                        />

                                        {/* Type badge */}
                                        <Badge variant="outline" className={cn("text-[9px] shrink-0", cfg.badge)}>
                                          {cfg.label}
                                        </Badge>

                                        {/* Delete */}
                                        <button
                                          onClick={() => removeEvent(student.id, event.id)}
                                          className="h-6 w-6 flex items-center justify-center rounded text-destructive/30 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>

                                      {/* Event details row */}
                                      <div className="flex items-center gap-2 pl-7 flex-wrap">
                                        {/* Date */}
                                        <input
                                          type="date"
                                          value={event.date}
                                          onChange={(e) => updateEvent(student.id, event.id, "date", e.target.value)}
                                          className="h-7 px-2 rounded border border-border/40 bg-background text-[11px] focus:border-primary/40 outline-none"
                                        />
                                        {/* Time */}
                                        <input
                                          type="time"
                                          value={event.time}
                                          onChange={(e) => updateEvent(student.id, event.id, "time", e.target.value)}
                                          className="h-7 px-2 rounded border border-border/40 bg-background text-[11px] focus:border-primary/40 outline-none"
                                        />
                                        {/* Type selector */}
                                        <select
                                          value={event.type}
                                          onChange={(e) => updateEvent(student.id, event.id, "type", e.target.value)}
                                          className="h-7 px-2 rounded border border-border/40 bg-background text-[11px] focus:border-primary/40 outline-none"
                                        >
                                          {EVENT_TYPE_OPTIONS.map((t) => (
                                            <option key={t} value={t}>{EVENT_TYPE_CONFIG[t].label}</option>
                                          ))}
                                        </select>

                                        {/* Status indicators */}
                                        {!event.completed && today && (
                                          <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Aujourd&apos;hui</span>
                                        )}
                                        {!event.completed && past && (
                                          <span className="text-[9px] font-semibold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">En retard</span>
                                        )}
                                      </div>

                                      {/* Description */}
                                      <div className="pl-7">
                                        <input
                                          value={event.description}
                                          onChange={(e) => updateEvent(student.id, event.id, "description", e.target.value)}
                                          placeholder="Notes, détails…"
                                          className="w-full h-7 px-2 rounded border border-border/40 bg-background text-[11px] text-muted-foreground focus:border-primary/40 focus:text-foreground outline-none"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </>
                      )}

                      {/* ═══ Sub-tab: Messages ═══ */}
                      {activeSubTab === "email" && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> Adresse email de {fullName}
                            </label>
                            <input
                              type="email"
                              value={student.email ?? ""}
                              onChange={(e) => updateStudent(student.id, "email", e.target.value)}
                              placeholder="etudiant@universite.dz"
                              className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            />
                          </div>

                          {/* Quick message templates */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              <Send className="h-4 w-4 text-primary" />
                              Messages rapides
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Cliquez sur un modèle pour ouvrir votre client email avec un message pré-rempli.
                            </p>

                            {[
                              {
                                label: "📅 Rappel de consultation",
                                subject: "Rappel - Consultation mémoire - {etudiant}",
                                body: "Bonjour {etudiant},\n\nJe vous rappelle que notre prochaine consultation concernant votre mémoire « {titre} » est prévue prochainement.\n\nMerci de bien vouloir préparer :\n- L'avancement de votre travail\n- Les difficultés rencontrées\n- Les questions éventuelles\n\nCordialement.",
                              },
                              {
                                label: "📝 Remise de chapitre",
                                subject: "Rappel - Remise du chapitre - {etudiant}",
                                body: "Bonjour {etudiant},\n\nJe vous rappelle que la date limite pour la remise du chapitre de votre mémoire « {titre} » approche.\n\nMerci de veiller à :\n- Respecter la date limite\n- Vérifier la cohérence du contenu\n- Relire avant l'envoi\n\nN'hésitez pas si vous avez des questions.\n\nCordialement.",
                              },
                              {
                                label: "✅ Validation d'avancement",
                                subject: "Validation d'avancement - {etudiant}",
                                body: "Bonjour {etudiant},\n\nSuite à notre dernière réunion, je vous confirme que l'avancement de votre mémoire « {titre} » est satisfaisant.\n\nProchaines étapes :\n- Continuer le travail dans les délais prévus\n- Préparer la prochaine consultation\n\nJe reste disponible pour toute question.\n\nCordialement.",
                              },
                              {
                                label: "⚠️ Rappel important",
                                subject: "IMPORTANT - Suivi mémoire - {etudiant}",
                                body: "Bonjour {etudiant},\n\nJe me permets de vous contacter concernant l'avancement de votre mémoire « {titre} ».\n\nIl est important de:\n- Maintenir un rythme de travail régulier\n- Respecter les délais convenus\n- Communiquer en cas de difficulté\n\nMerci de me confirmer la réception de ce message.\n\nCordialement.",
                              },
                            ].map((template) => (
                              <button
                                key={template.label}
                                onClick={() => sendEmail(student, template.subject, template.body)}
                                disabled={!student.email}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm border transition-all",
                                  student.email
                                    ? "border-border/60 bg-background hover:bg-muted hover:border-primary/20 cursor-pointer"
                                    : "border-border/30 bg-muted/30 opacity-50 cursor-not-allowed",
                                )}
                              >
                                <span className="text-base">{template.label.split(" ")[0]}</span>
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-xs">{template.label.split(" ").slice(1).join(" ")}</span>
                                </div>
                                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              </button>
                            ))}
                          </div>

                          {!student.email && (
                            <div className="text-center py-3 text-xs text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                              Renseignez l&apos;adresse email de l&apos;étudiant dans l&apos;onglet « Informations » pour activer l&apos;envoi de messages.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add student button */}
          <button
            onClick={addStudent}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-dashed border-border w-full justify-center"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un étudiant
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
