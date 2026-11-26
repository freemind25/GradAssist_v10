"use client";

import type * as React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BookCopy, Plus, FolderPlus, Trash2, Download, Upload, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_CRITERIA, TARGET_SUM_COEFFICIENTS } from "@/config/grading-config";
import type { EvaluationData, EvaluationModule as EvaluationModuleType, ModuleType } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EvaluationModule } from '@/components/evaluation-module';
import { HelpGuideDialog } from '@/components/help-guide-dialog';
import { TeacherLogin, getTeacher, type TeacherProfile } from '@/components/teacher-login';
import { GoogleDriveSync } from '@/components/google-drive-sync';
import { PwaInstallBanner } from '@/components/pwa-install';
import { BackupReminder } from '@/components/backup-reminder';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  downloadBackup,
  parseBackup,
  estimateStorageBytes,
  formatBytes,
  getBackupStatus,
  recordBackupExport,
  saveSafetySnapshot,
  readSafetySnapshot,
  type BackupStatus,
  type ParsedBackup,
  type SafetySnapshotInfo,
} from '@/lib/backup-service';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const LOCALSTORAGE_MODULES_KEY = 'gradeAssist_modules';
const LOCALSTORAGE_ACTIVE_MODULE_ID_KEY = 'gradeAssist_activeModuleId';
const LOCALSTORAGE_VERSION_KEY = 'gradeAssist_version';
// Injectée au build depuis package.json (voir next.config.ts) : une seule
// version pour l'application, l'export et les rapports.
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';

// Default module names from older versions that should be replaced
const OLD_DEFAULT_MODULE_NAMES = [
  'Atelier Projet de Ville 1',
  'Projet de Ville 1',
  'Atelier Projet de Ville 2',
  'Projet de Ville 2',
  'Urbanisme',
  'Cours',
  'Cours et TD',
  'Atelier',
];

const getNewEvaluationModule = (type: ModuleType, name: string): EvaluationModuleType => {
  const baseModule = {
    id: `module_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name,
    type: type,
    evaluationData: {
      id: `eval_${Date.now()}`,
      studentNames: [],
      teacherNames: [""],
      projectName: "",
      studyLevel: "",
      studySubLevel: "",
      session: "",
      academicYear: "",
      universityName: "",
      establishmentName: "",
      departmentName: "",
      masterSpecialty: "",
      universityLogo: null,
      selectedGrades: {},
      totalPoints: 0,
      evaluationSheetTitleComplement: "...............................................................",
      criteria: type === 'atelier' ? DEFAULT_CRITERIA : [],
      attendance: {},
      thesisStudents: [],
      adminEmail: "",
      syllabus: { chapters: [], pdfFileName: null, pdfDataUrl: null },
      quickNotes: [],
      workGroups: [],
      tutoringSessions: [],
      studentResults: [],
      atRiskConfig: { attendanceThreshold: 75, gradeThreshold: 10 },
      continuousAssessmentGrade: (type === 'standard' || type === 'mooc') ? 10 : undefined,
      examGrade: (type === 'standard' || type === 'mooc') ? 10 : undefined,
      continuousAssessmentWeight: (type === 'standard' || type === 'mooc') ? 40 : undefined,
    },
  };

  return baseModule;
};


function NewModuleDialog({ onCreate, trigger }: { onCreate: (name: string, type: ModuleType) => void, trigger?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ModuleType>("atelier");
  const { toast } = useToast();

  const handleCreate = () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Nom manquant",
        description: "Veuillez donner un nom à la nouvelle matière.",
      });
      return;
    }
    onCreate(name, type);
    setName("");
    setType("atelier");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <MenubarItem onSelect={(e) => e.preventDefault()}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Nouveau Module...
          </MenubarItem>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle matière</DialogTitle>
          <DialogDescription>
            Choisissez un nom et un type d&apos;évaluation pour votre nouvelle matière ou atelier.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="module-name" className="text-right">
              Nom
            </Label>
            <Input
              id="module-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Nom de la matière ou de l'atelier"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="module-type" className="text-right">
              Type
            </Label>
            <RadioGroup
              defaultValue="atelier"
              className="col-span-3 flex flex-col gap-2"
              onValueChange={(value: ModuleType) => setType(value)}
              value={type}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="atelier" id="r-atelier" />
                <Label htmlFor="r-atelier" className='font-normal'>Atelier (Évaluation par critères)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="r-standard" />
                <Label htmlFor="r-standard" className='font-normal'>Matière Classique (CC + Examen)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mooc" id="r-mooc" />
                <Label htmlFor="r-mooc" className='font-normal'>Cours en ligne MOOC (CC + Examen)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialog for configuring an existing blank module (rename + choose type)
function ConfigureModuleDialog({ module, onConfigure, onDismiss }: { 
  module: EvaluationModuleType;
  onConfigure: (moduleId: string, name: string, type: ModuleType) => void;
  onDismiss: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [name, setName] = useState(module.name === "Nouvelle matière" ? "" : module.name);
  const [type, setType] = useState<ModuleType>(module.type);
  const { toast } = useToast();

  const handleConfigure = () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Nom manquant",
        description: "Veuillez donner un nom à la matière.",
      });
      return;
    }
    onConfigure(module.id, name, type);
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurer la matière</DialogTitle>
          <DialogDescription>
            Donnez un nom et choisissez le type d&apos;évaluation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="config-name" className="text-right">
              Nom
            </Label>
            <Input
              id="config-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Mathématiques, Physique..."
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Type
            </Label>
            <RadioGroup
              className="col-span-3 flex flex-col gap-2"
              onValueChange={(value: ModuleType) => setType(value)}
              value={type}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="atelier" id="c-atelier" />
                <Label htmlFor="c-atelier" className='font-normal'>Atelier (Évaluation par critères)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="c-standard" />
                <Label htmlFor="c-standard" className='font-normal'>Matière Classique (CC + Examen)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mooc" id="c-mooc" />
                <Label htmlFor="c-mooc" className='font-normal'>Cours en ligne MOOC (CC + Examen)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleDismiss}>Annuler</Button>
          <Button onClick={handleConfigure}>
            <Plus className="mr-2 h-4 w-4" />
            Configurer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function GradeAssistPage() {
  const [modules, setModules] = useState<EvaluationModuleType[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [teacher, setTeacherState] = useState<TeacherProfile | null>(null);
  const [teacherChecked, setTeacherChecked] = useState(false);
  const [configuringModuleId, setConfiguringModuleId] = useState<string | null>(null);
  // Module dont l'utilisateur a refusé la configuration : on ne le rouvre plus
  // automatiquement (l'effet d'auto-ouverture le faisait à chaque rendu).
  const [dismissedBlankId, setDismissedBlankId] = useState<string | null>(null);
  const [storageFull, setStorageFull] = useState(false);
  const [pendingImport, setPendingImport] = useState<
    (ParsedBackup & { fileName: string }) | null
  >(null);
  // Suivi de la sauvegarde : dernière date d'export et copie de sécurité
  // automatique disponible sur l'appareil.
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [safetySnapshot, setSafetySnapshot] =
    useState<SafetySnapshotInfo | null>(null);
  const [reminderHidden, setReminderHidden] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    try {
      const modulesData = localStorage.getItem(LOCALSTORAGE_MODULES_KEY);
      const activeIdData = localStorage.getItem(LOCALSTORAGE_ACTIVE_MODULE_ID_KEY);
      
      let loadedModules: EvaluationModuleType[] = [];
      if (modulesData) {
        loadedModules = JSON.parse(modulesData);
      }
      
      // Migration: check version and replace old default modules
      const storedVersion = localStorage.getItem(LOCALSTORAGE_VERSION_KEY);
      if (storedVersion !== APP_VERSION && Array.isArray(loadedModules) && loadedModules.length > 0) {
        // La migration remplace des modules : on conserve une copie de l'état
        // d'avant, restaurable depuis le bandeau de sauvegarde.
        const willMigrate = loadedModules.some((m) =>
          OLD_DEFAULT_MODULE_NAMES.includes(m.name)
        );
        if (willMigrate) {
          saveSafetySnapshot(loadedModules, "avant migration de version", APP_VERSION);
        }
        loadedModules = loadedModules.map((m) => {
          if (OLD_DEFAULT_MODULE_NAMES.includes(m.name)) {
            return getNewEvaluationModule('atelier', 'Nouvelle matière');
          }
          return m;
        });
        localStorage.setItem(LOCALSTORAGE_VERSION_KEY, APP_VERSION);
      }

      if (!Array.isArray(loadedModules) || loadedModules.length === 0) {
        loadedModules = [
          getNewEvaluationModule('atelier', 'Nouvelle matière'),
          getNewEvaluationModule('standard', 'Nouvelle matière'),
          getNewEvaluationModule('mooc', 'Nouvelle matière'),
        ];
        localStorage.setItem(LOCALSTORAGE_VERSION_KEY, APP_VERSION);
      }
      
      setModules(loadedModules);

      let activeId = activeIdData ? JSON.parse(activeIdData) : null;
      if (!activeId || !loadedModules.some(m => m.id === activeId)) {
        activeId = loadedModules[0]?.id || null;
      }
      setActiveModuleId(activeId);

    } catch (error) {
      console.error("Failed to load data from localStorage.", error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les données locales. L'application a été réinitialisée.",
      });
      const m1 = getNewEvaluationModule('atelier', 'Nouvelle matière');
      const m2 = getNewEvaluationModule('standard', 'Nouvelle matière');
      const m3 = getNewEvaluationModule('mooc', 'Nouvelle matière');
      setModules([m1, m2, m3]);
      setActiveModuleId(m1.id);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Écriture dans localStorage : signale explicitement un quota dépassé.
  // Auparavant l'échec était seulement journalisé en console, alors que le
  // pied de page affirmait « Données sauvegardées localement ».
  const persist = useCallback(
    (mods: EvaluationModuleType[], activeId: string | null): boolean => {
      try {
        localStorage.setItem(LOCALSTORAGE_MODULES_KEY, JSON.stringify(mods));
        localStorage.setItem(
          LOCALSTORAGE_ACTIVE_MODULE_ID_KEY,
          JSON.stringify(activeId)
        );
        setStorageFull(false);
        return true;
      } catch (error) {
        console.error("Échec de la sauvegarde locale :", error);
        setStorageFull(true);
        return false;
      }
    },
    []
  );

  useEffect(() => {
    if (!isLoaded) return;
    const handler = setTimeout(() => {
      persist(modules, activeModuleId);
    }, 1000);
    return () => clearTimeout(handler);
  }, [modules, activeModuleId, isLoaded, persist]);

  // Le debounce d'une seconde perdait la dernière modification si l'utilisateur
  // fermait l'onglet, rechargeait la page ou basculait d'application juste
  // après une saisie : le module créé n'était jamais écrit. On force une
  // écriture dès que la page quitte le premier plan.
  useEffect(() => {
    if (!isLoaded) return;

    const flush = () => {
      persist(modules, activeModuleId);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [modules, activeModuleId, isLoaded, persist]);

  // Date du dernier export et ancienneté de la sauvegarde : recalculées à
  // chaque modification, pour que le rappel reste juste.
  useEffect(() => {
    if (!isLoaded) return;
    setBackupStatus(getBackupStatus(modules));
  }, [modules, isLoaded]);

  // Copie de sécurité présente sur l'appareil (avant import ou migration).
  useEffect(() => {
    const snapshot = readSafetySnapshot();
    if (!snapshot) return;
    setSafetySnapshot({
      savedAt: snapshot.savedAt,
      reason: snapshot.reason,
      moduleCount: snapshot.moduleCount,
    });
  }, []);

  // Check teacher login
  useEffect(() => {
    const t = getTeacher();
    setTeacherState(t);
    setTeacherChecked(true);
  }, []);

  const activeModule = useMemo(() => modules.find(m => m.id === activeModuleId), [modules, activeModuleId]);

  // Check if the active module is a blank/unconfigured module
  const isModuleBlank = useMemo(() => {
    if (!activeModule) return false;
    return activeModule.name === 'Nouvelle matière' && 
           !activeModule.evaluationData.universityName &&
           activeModule.evaluationData.studentNames.length === 0;
  }, [activeModule]);

  // Auto-trigger configuration dialog for blank modules
  useEffect(() => {
    if (
      isLoaded &&
      isModuleBlank &&
      activeModule &&
      !configuringModuleId &&
      activeModule.id !== dismissedBlankId
    ) {
      setConfiguringModuleId(activeModule.id);
    }
  }, [isLoaded, isModuleBlank, activeModule, configuringModuleId, dismissedBlankId]);

  const handleConfigureModule = useCallback((moduleId: string, name: string, type: ModuleType) => {
    setModules(prevModules => {
      return prevModules.map(module => {
        if (module.id === moduleId) {
          return { ...module, name, type };
        }
        return module;
      });
    });
    setConfiguringModuleId(null);
    toast({
      title: "Matière configurée",
      description: `La matière "${name}" a été configurée.`,
    });
  }, [toast]);

  const handleTabClick = useCallback((moduleId: string) => {
    setActiveModuleId(moduleId);
  }, []);

  const handleUpdateModule = useCallback((moduleId: string, update: Partial<EvaluationData>) => {
    setModules(prevModules => {
      return prevModules.map(module => {
        if (module.id === moduleId) {
          const updatedData = { ...module.evaluationData, ...update };
          
          if (module.type === 'atelier' && (update.criteria || update.selectedGrades)) {
            const newTotalPoints = updatedData.criteria.reduce((sum, criterion) => {
              const numericGradeStr = updatedData.selectedGrades[criterion.id];
              if (numericGradeStr && numericGradeStr !== "__NONE__") {
                const points = parseFloat(numericGradeStr);
                return sum + (isNaN(points) ? 0 : points);
              }
              return sum;
            }, 0);
            updatedData.totalPoints = newTotalPoints;
          }
          return { ...module, evaluationData: updatedData };
        }
        return module;
      });
    });
  }, []);

  const handleCreateModule = useCallback((name: string, type: ModuleType) => {
    const newModule = getNewEvaluationModule(type, name);
    if (activeModule) {
      newModule.evaluationData.universityName = activeModule.evaluationData.universityName;
      newModule.evaluationData.establishmentName = activeModule.evaluationData.establishmentName;
      newModule.evaluationData.departmentName = activeModule.evaluationData.departmentName;
      newModule.evaluationData.universityLogo = activeModule.evaluationData.universityLogo;
      newModule.evaluationData.teacherNames = [...activeModule.evaluationData.teacherNames];
    }
    setModules(prev => [...prev, newModule]);
    setActiveModuleId(newModule.id);
    toast({
      title: "Matière créée",
      description: `La matière "${name}" a été ajoutée.`,
    });
  }, [activeModule, toast]);
  
  const handleDeleteModule = useCallback((moduleId: string) => {
    if (modules.length <= 1) {
       toast({ variant: 'destructive', title: "Action impossible", description: "Vous ne pouvez pas supprimer le dernier module." });
       return;
    }

    setModules(prev => {
        const newModules = prev.filter(m => m.id !== moduleId);
        if (activeModuleId === moduleId) {
            setActiveModuleId(newModules[0]?.id || null);
        }
        return newModules;
    });
    toast({ title: "Module Supprimé", description: "Le module a été supprimé." });
  }, [modules.length, activeModuleId, toast]);

  // ── Sauvegarde et restauration locales ────────────────────────────────
  // Le stockage du navigateur n'est pas une sauvegarde : ces deux actions
  // produisent un fichier que l'enseignant conserve hors de l'application.
  const storageBytes = useMemo(() => estimateStorageBytes(modules), [modules]);

  // Libellé de la dernière sauvegarde, affiché en pied de page.
  const lastBackupLabel = !backupStatus?.lastBackupAt
    ? "aucune"
    : backupStatus.daysSinceBackup === 0
      ? "aujourd'hui"
      : `il y a ${backupStatus.daysSinceBackup} j`;

  const handleExportBackup = useCallback(() => {
    if (modules.length === 0) {
      toast({
        variant: "destructive",
        title: "Rien à sauvegarder",
        description: "Aucun module n'est chargé.",
      });
      return;
    }
    try {
      const bytes = downloadBackup(modules, APP_VERSION);
      // Le fichier est parti : le rappel de sauvegarde repart de zéro.
      recordBackupExport();
      setBackupStatus(getBackupStatus(modules));
      toast({
        title: "Sauvegarde téléchargée",
        description: `${modules.length} module(s), ${formatBytes(bytes)}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sauvegarde impossible",
        description:
          error instanceof Error ? error.message : "Erreur inconnue.",
      });
    }
  }, [modules, toast]);

  const handleBackupFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = parseBackup(text);
        setPendingImport({ ...parsed, fileName: file.name });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Restauration impossible",
          description:
            error instanceof Error ? error.message : "Fichier invalide.",
        });
      }
    },
    [toast]
  );

  const applyImport = useCallback(
    (mode: "replace" | "merge") => {
      if (!pendingImport) return;
      const imported = pendingImport.modules;

      // Filet de sécurité : l'état actuel reste restaurable si l'import ne
      // contenait pas ce que l'enseignant attendait.
      const snapshot = saveSafetySnapshot(
        modules,
        "avant restauration d'une sauvegarde",
        APP_VERSION
      );

      // En mode « ajouter », les identifiants sont régénérés pour ne jamais
      // écraser un module existant.
      const prepared =
        mode === "replace"
          ? imported
          : imported.map((module, index) => ({
              ...module,
              id: `module_${Date.now()}_${index}`,
              evaluationData: {
                ...module.evaluationData,
                id: `eval_${Date.now()}_${index}`,
              },
            }));

      const nextModules =
        mode === "replace" ? prepared : [...modules, ...prepared];

      setModules(nextModules);
      setActiveModuleId(nextModules[0]?.id ?? null);
      setPendingImport(null);
      setSafetySnapshot(snapshot);
      toast({
        title: "Sauvegarde restaurée",
        description: `${imported.length} module(s) ${
          mode === "replace" ? "restaurés" : "ajoutés"
        }.`,
      });
    },
    [pendingImport, modules, toast]
  );

  // Restauration de la copie de sécurité automatique : elle passe par le
  // même dialogue de confirmation que l'import d'un fichier.
  const handleRestoreSafety = useCallback(() => {
    const snapshot = readSafetySnapshot();
    if (!snapshot) {
      setSafetySnapshot(null);
      toast({
        variant: "destructive",
        title: "Copie introuvable",
        description:
          "La copie de sécurité n'est plus disponible sur cet appareil.",
      });
      return;
    }

    try {
      const parsed = parseBackup(snapshot.json);
      const when = new Date(snapshot.savedAt).toLocaleString("fr-FR");
      setPendingImport({
        ...parsed,
        fileName: `copie de sécurité du ${when}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Restauration impossible",
        description:
          error instanceof Error ? error.message : "Copie de sécurité illisible.",
      });
    }
  }, [toast]);

  // Show teacher login screen if not yet identified
  if (teacherChecked && !teacher) {
    return <TeacherLogin onLogin={(profile) => setTeacherState(profile)} />;
  }

  if (!isLoaded || !activeModule) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Chargement de l&apos;application...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen">
        {/* Premium Gradient Header */}
        <header className="relative overflow-hidden bg-gradient-to-r from-[hsl(var(--header-gradient-from))] to-[hsl(var(--header-gradient-to))] text-primary-foreground">
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-5 gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-[52px] h-[52px] flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 transition-transform hover:scale-105">
                  <svg width="36" height="36" viewBox="0 0 80 75" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                    <path d="M39.9992 4.16669L4.16589 24.1667L15.2284 30.0768V50.8334L39.9992 64.5834L75.8325 41.6667V20.8334L69.1659 16.9768M39.9992 4.16669L75.8325 24.1667L39.9992 44.1667L4.16589 24.1667M62.4992 55.8334L39.9992 69.5834V49.1667L62.4992 35.4167V55.8334Z" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Grade<span className="text-accent">Assist</span>
                  </h1>
                  <p className="text-xs text-white/60 font-medium mt-0.5">Gestion Pédagogique Universitaire · Designed by M.SADI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HelpGuideDialog />
                <GoogleDriveSync />

                <Menubar className="bg-white/10 border-white/15 text-white hover:bg-white/15">
                  <MenubarMenu>
                    <MenubarTrigger className="text-white/90 hover:text-white data-[state=open]:bg-white/15">
                      <FolderPlus className="mr-1.5 h-4 w-4" />
                      Fichier
                    </MenubarTrigger>
                    <MenubarContent>
                      <NewModuleDialog onCreate={handleCreateModule} />
                      <MenubarSeparator />
                      {modules.length > 1 && (
                        <MenubarItem onClick={() => handleDeleteModule(activeModule.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer le module actif
                        </MenubarItem>
                      )}
                      <MenubarSeparator />
                      <MenubarItem onSelect={handleExportBackup}>
                        <Download className="mr-2 h-4 w-4" />
                        Sauvegarder mes données (JSON)
                      </MenubarItem>
                      <MenubarItem onSelect={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Restaurer une sauvegarde…
                      </MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
              </div>
            </div>
          </div>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleBackupFile(file);
            event.target.value = "";
          }}
        />

        {backupStatus && !reminderHidden && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <BackupReminder
              status={backupStatus}
              storageBytes={storageBytes}
              safetySnapshot={safetySnapshot}
              onBackup={handleExportBackup}
              onRestoreSafety={handleRestoreSafety}
              onDismiss={() => setReminderHidden(true)}
            />
          </div>
        )}

        {storageFull && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Stockage local saturé</AlertTitle>
              <AlertDescription>
                Les dernières modifications n&apos;ont pas pu être enregistrées :
                le quota du navigateur est atteint. Téléchargez une sauvegarde
                (menu Fichier), puis allégez les modules les plus lourds (logos,
                PDF de canevas).
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Module Tabs Bar */}
        <div className="bg-card border-b sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-2 overflow-x-auto">
              {modules.map(module => (
                <button
                  key={module.id}
                  onClick={() => handleTabClick(module.id)}
                  onDoubleClick={() => setConfiguringModuleId(module.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    module.id === activeModuleId
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <BookCopy className="h-4 w-4" />
                  {module.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    module.type === 'atelier' ? 'badge-atelier' : module.type === 'mooc' ? 'badge-mooc' : 'badge-matiere'
                  }`}>
                    {module.type === 'atelier' ? 'ATELIER' : module.type === 'mooc' ? 'MOOC' : 'MATIÈRE'}
                  </span>
                </button>
              ))}
              <NewModuleDialog
                onCreate={handleCreateModule}
                trigger={
                  <button
                    data-testid="add-module"
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-dashed border-border"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Ajouter</span>
                  </button>
                }
              />
              {modules.length > 1 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors ml-auto">
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le module ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action supprimera définitivement « {activeModule.name} » et toutes ses données.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteModule(activeModule.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* Configure Module Dialog (for blank modules) */}
        {configuringModuleId && (
          <ConfigureModuleDialog
            module={modules.find(m => m.id === configuringModuleId)!}
            onConfigure={handleConfigureModule}
            onDismiss={() => {
              // Mémorise le refus : sans cela, l'effet d'auto-ouverture
              // rouvrait le dialogue aussitôt tant que le module restait vide.
              setDismissedBlankId(configuringModuleId);
              setConfiguringModuleId(null);
            }}
          />
        )}

        <AlertDialog
          open={pendingImport !== null}
          onOpenChange={(open) => {
            if (!open) setPendingImport(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurer cette sauvegarde ?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingImport
                  ? `${pendingImport.modules.length} module(s) trouvés dans « ${pendingImport.fileName} ». « Remplacer » écrase les modules actuellement chargés ; « Ajouter » les conserve et ajoute la sauvegarde à côté.`
                  : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => applyImport("merge")}>
                Ajouter
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => applyImport("replace")}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remplacer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <EvaluationModule
                key={activeModule.id}
                module={activeModule}
                onUpdate={(update) => handleUpdateModule(activeModule.id, update)}
                onSave={() => {
                    persist(modules, activeModuleId);
                }}
            />
          
            <PwaInstallBanner />

            <footer className="text-center text-sm text-muted-foreground py-8 border-t">
                <p>&copy; {new Date().getFullYear()} GradeAssist. Tous droits réservés.</p>
                <p className="mt-1">
                  Données enregistrées sur cet appareil · {modules.length} module(s) ·{" "}
                  {formatBytes(storageBytes)} utilisés · Sauvegarde : {lastBackupLabel}
                </p>
                <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                    <Link href="/confidentialite" className="hover:text-accent underline-offset-4 hover:underline">Politique de confidentialité</Link>
                    <Link href="/conditions" className="hover:text-accent underline-offset-4 hover:underline">Conditions d&apos;utilisation</Link>
                </p>
            </footer>
        </div>
    </div>
  );
}
