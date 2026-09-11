"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, LogOut, UserCircle, KeyRound, Info } from "lucide-react";

// [SEC-04c] Authentification hybride :
// - Option A : Login/signup via Supabase Auth (sécurisé, JWT httpOnly)
// - Option B : "Continuer sans identification" (mode invité, exigence métier conservée)
// Le bouton "Continuer sans identification" est maintenu par exigence du commanditaire.

export interface TeacherProfile {
  id: string;
  email: string;
  fullName: string;
  department: string | null;
  role: "teacher" | "admin" | "guest";
  loggedAt: string;
}

interface AuthResponse {
  user?: {
    id: string;
    email: string;
    fullName?: string;
    department?: string | null;
    role?: string;
  };
  error?: string;
  message?: string;
}

const TEACHER_KEY = "gradeAssist_teacher";

// --- Mode invité (localStorage) ---

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

// --- Auth Supabase (route /api/auth) ---

async function fetchSession(): Promise<TeacherProfile | null> {
  try {
    const res = await fetch("/api/auth", { method: "GET" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.fullName ?? "Enseignant",
      department: data.user.department ?? null,
      role: (data.user.role as "teacher" | "admin") ?? "teacher",
      loggedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", email, password }),
  });
  return res.json();
}

async function signup(
  email: string,
  password: string,
  fullName: string,
  department: string
): Promise<AuthResponse> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "signup",
      email,
      password,
      fullName,
      department,
    }),
  });
  return res.json();
}

async function logout(): Promise<void> {
  // Tenter logout Supabase (si session serveur)
  try {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
  } catch {
    // Ignorer — peut être en mode invité
  }
  // Toujours nettoyer localStorage (mode invité)
  clearTeacher();
}

interface TeacherLoginProps {
  onLogin: (profile: TeacherProfile) => void;
  onLogout?: () => void;
  currentTeacher?: TeacherProfile | null;
  mode?: "login" | "signup-prefilled";
  prefillEmail?: string;
}

export function TeacherLogin({
  onLogin,
  onLogout,
  currentTeacher,
  mode: initialMode = "login",
  prefillEmail = "",
}: TeacherLoginProps) {
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">(
    initialMode === "signup-prefilled" ? "signup" : "login"
  );
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Vérifier session Supabase (si connecté serveur)
    fetchSession().then((profile) => {
      if (profile) {
        onLogin(profile);
        return;
      }
      // Sinon, vérifier mode invité localStorage
      const guest = getTeacher();
      if (guest) onLogin(guest);
    });
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "login") {
      if (!email.trim() || !password.trim()) {
        toast({
          variant: "destructive",
          title: "Champs requis",
          description: "Email et mot de passe sont obligatoires.",
        });
        return;
      }
    } else {
      if (!email.trim() || !password.trim() || !fullName.trim()) {
        toast({
          variant: "destructive",
          title: "Champs requis",
          description: "Email, mot de passe et nom complet sont obligatoires.",
        });
        return;
      }
      if (password.length < 8) {
        toast({
          variant: "destructive",
          title: "Mot de passe trop court",
          description: "Minimum 8 caractères.",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      let response: AuthResponse;
      if (mode === "login") {
        response = await login(email.trim(), password);
      } else {
        response = await signup(email.trim(), password, fullName.trim(), department.trim());
      }

      if (response.error) {
        toast({
          variant: "destructive",
          title: "Échec d'authentification",
          description: response.error,
        });
        return;
      }

      if (mode === "signup" && response.message) {
        toast({
          title: "Compte créé",
          description: response.message + " Vous pouvez vous connecter.",
        });
        setMode("login");
        setPassword("");
        return;
      }

      if (response.user) {
        const profile: TeacherProfile = {
          id: response.user.id,
          email: response.user.email,
          fullName: response.user.fullName ?? "Enseignant",
          department: response.user.department ?? null,
          role: (response.user.role as "teacher" | "admin") ?? "teacher",
          loggedAt: new Date().toISOString(),
        };
        toast({
          title: "✅ Bienvenue",
          description: `Connecté en tant que ${profile.fullName}`,
        });
        onLogin(profile);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur réseau",
        description: "Impossible de contacter le serveur d'authentification.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    // [Exigence] Mode invité — conservation du bouton "Continuer sans identification"
    // Données stockées en localStorage (pas de session serveur)
    const profile: TeacherProfile = {
      id: "guest_" + Date.now(),
      name: "Enseignant",
      email: "local@gradeassist.app",
      department: "",
      role: "guest",
      loggedAt: new Date().toISOString(),
    } as TeacherProfile;
    setTeacher(profile);
    toast({
      title: "Mode invité",
      description: "Vous utilisez GradeAssist sans compte. Vos données restent locales.",
    });
    onLogin(profile);
  };

  const handleLogout = async () => {
    await logout();
    toast({ title: "Déconnexion", description: "À bientôt." });
    onLogout?.();
  };

  // Si déjà connecté, afficher bouton déconnexion
  if (currentTeacher) {
    return (
      <div className="flex items-center gap-3">
        <UserCircle className="h-6 w-6 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-medium">{currentTeacher.fullName}</p>
          {currentTeacher.department && (
            <p className="text-xs text-muted-foreground">{currentTeacher.department}</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="ml-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
          title="Se déconnecter"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    );
  }

  // Page de login/signup plein écran
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

          {/* Card login/signup */}
          <div className="bg-card border border-border rounded-2xl shadow-lg p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                {mode === "login" ? "Identification de l'enseignant" : "Créer un compte enseignant"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {mode === "login"
                  ? "Connectez-vous pour synchroniser vos données sur vos appareils."
                  : "Inscription sécurisée via Supabase Auth."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="teacher-name" className="text-sm font-medium">
                      Nom complet <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="teacher-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: SADI Messaoud"
                      className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
                      autoFocus
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
                      placeholder="Ex: Informatique"
                      className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
                    />
                  </div>
                </>
              )}

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
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="teacher-password" className="text-sm font-medium">
                  Mot de passe <span className="text-destructive">*</span>
                </label>
                <input
                  id="teacher-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Minimum 8 caractères" : "Votre mot de passe"}
                  className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  isLoading
                    ? "bg-muted text-muted-foreground cursor-wait"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                )}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Se connecter →" : "Créer mon compte →"}
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-accent hover:underline"
              >
                {mode === "login"
                  ? "Pas encore de compte ? S'inscrire"
                  : "Déjà un compte ? Se connecter"}
              </button>
            </div>

            {/* [Exigence] Bouton "Continuer sans identification" conservé */}
            <div className="pt-2 border-t">
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2 rounded-lg text-sm text-muted-foreground hover:text-accent border border-transparent hover:border-accent/40 transition-all underline-offset-4 hover:underline"
              >
                Continuer sans identification →
              </button>
              <p className="text-[10px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Info className="h-3 w-3" />
                Mode invité : vos données restent locales sur votre appareil.
              </p>
            </div>
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
