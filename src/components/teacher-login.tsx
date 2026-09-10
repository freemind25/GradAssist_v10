"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TEACHER_KEY = "gradeAssist_teacher";

export interface TeacherProfile {
  name: string;
  email: string;
  department: string;
  loggedAt: string;
}

export function getTeacher(): TeacherProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TEACHER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setTeacher(profile: TeacherProfile) {
  localStorage.setItem(TEACHER_KEY, JSON.stringify(profile));
}

export function clearTeacher() {
  localStorage.removeItem(TEACHER_KEY);
}

interface TeacherLoginProps {
  onLogin: (profile: TeacherProfile) => void;
}

export function TeacherLogin({ onLogin }: TeacherLoginProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const saved = getTeacher();
    if (saved) onLogin(saved);
  }, [onLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ variant: "destructive", title: "Champs requis", description: "Nom et email sont obligatoires." });
      return;
    }
    const profile: TeacherProfile = { name: name.trim(), email: email.trim(), department: department.trim(), loggedAt: new Date().toISOString() };
    setTeacher(profile);
    toast({ title: "✅ Bienvenue", description: `Connecté en tant que ${profile.name}` });
    onLogin(profile);
  };

  return (
    <div className="min-h-screen flex flex-col">
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--muted))]/30 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <svg width="36" height="36" viewBox="0 0 80 75" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
              <path d="M39.9992 4.16669L4.16589 24.1667L15.2284 30.0768V50.8334L39.9992 64.5834L75.8325 41.6667V20.8334L69.1659 16.9768M39.9992 4.16669L75.8325 24.1667L39.9992 44.1667L4.16589 24.1667M62.4992 55.8334L39.9992 69.5834V49.1667L62.4992 35.4167V55.8334Z" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Grade<span className="text-accent">Assist</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion Pédagogique Universitaire</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Identification de l&apos;enseignant</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Facultatif — personnalise l&apos;en-tête de vos documents et rapports.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="teacher-name" className="text-sm font-medium">
                Nom complet <span className="text-destructive">*</span>
              </label>
              <input
                id="teacher-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: SADI Messaoud"
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="teacher-email" className="text-sm font-medium">
                Email universitaire <span className="text-destructive">*</span>
              </label>
              <input
                id="teacher-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@univ-constantine3.dz"
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="teacher-dept" className="text-sm font-medium">
                Département
              </label>
              <input
                id="teacher-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: Gestion des Villes et l'Urbanisation"
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
              />
            </div>

          <button
              type="submit"
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-semibold transition-all",
                name.trim() && email.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              disabled={!name.trim() || !email.trim()}
            >
              Commencer →
            </button>
          </form>

          <div className="pt-2">
            <button
              type="button"
              onClick={() =>
                onLogin({
                  name: "Enseignant",
                  email: "local@gradeassist.app",
                  department: "",
                  loggedAt: new Date().toISOString(),
                })
              }
              className="w-full py-2 rounded-lg text-sm text-muted-foreground hover:text-accent border border-transparent hover:border-accent/40 transition-all underline-offset-4 hover:underline"
            >
              Continuer sans identification →
            </button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            L&apos;identification est facultative : elle personnalise vos rapports.
            <br />Toutes vos données restent enregistrées localement sur votre appareil.
          </p>
        </div>
      </div>
    </div>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GradeAssist. Tous droits réservés.</p>
        <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <a href="/confidentialite" className="hover:text-accent underline underline-offset-4">Politique de confidentialité</a>
          <span aria-hidden="true">·</span>
          <a href="/conditions" className="hover:text-accent underline underline-offset-4">Conditions d&apos;utilisation</a>
        </p>
      </footer>
    </div>
  );
}
