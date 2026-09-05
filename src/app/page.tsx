
"use client";

import type * as React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BookCopy, Plus, FolderPlus, Trash2, Cloud, CloudOff, RefreshCw, Download, Upload, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_CRITERIA, TARGET_SUM_COEFFICIENTS } from "@/config/grading-config";
import type { EvaluationData, EvaluationModule as EvaluationModuleType, ModuleType } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EvaluationModule } from '@/components/evaluation-module';
import { HelpGuideDialog } from '@/components/help-guide-dialog';
import { GoogleDriveSync } from '@/components/google-drive-sync';
import { saveToGoogleDrive, loadFromGoogleDrive } from '@/lib/google-drive-service';
import { NextcloudSync } from '@/components/nextcloud-sync';
import { TeacherLogin, getTeacher, type TeacherProfile } from '@/components/teacher-login';
import { PwaInstallBanner } from '@/components/pwa-install';

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


import { testConnection, saveToCloud, loadFromCloud, syncBidirectional } from '@/lib/sync-service';

const LOCALSTORAGE_MODULES_KEY = 'gradeAssist_modules';
const LOCALSTORAGE_ACTIVE_MODULE_ID_KEY = 'gradeAssist_activeModuleId';
const LOCALSTORAGE_VERSION_KEY = 'gradeAssist_version';
const APP_VERSION = '2.3.0';

// Default module names from older versions that should be replaced
const OLD_DEFAULT_MODULE_NAMES = [
  'Atelier Projet de Ville 1',
  'Projet de Ville 1',
  'Atelier Projet de Ville 2',
  'Projet de Ville 2',
  'Urbanisme',
];

const getNewEvaluationModule = (type: ModuleType, name: string): EvaluationModuleType => {
  const baseModule = {
    id: `module_${Date.now()}`,
    name: name,
    type: type,
    evaluationData: {
      id: `eval_${Date.now()}`,
      studentNames: ["Étudiant 1", "Étudiant 2", "Étudiant 3"],
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
      criteria: DEFAULT_CRITERIA,
      attendance: {},
      thesisStudents: [],
      adminEmail: "",
      syllabus: { chapters: [], pdfFileName: null, pdfDataUrl: null },
      quickNotes: [],
      workGroups: [],
      tutoringSessions: [],
      atRiskConfig: { attendanceThreshold: 75, gradeThreshold: 10 },
      continuousAssessmentGrade: type === 'standard' ? 10 : undefined,
      examGrade: type === 'standard' ? 10 : undefined,
      continuousAssessmentWeight: type === 'standard' ? 40 : undefined,
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


export default function GradeAssistPage() {
  const [modules, setModules] = useState<EvaluationModuleType[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [teacher, setTeacherState] = useState<TeacherProfile | null>(null);
  const [teacherChecked, setTeacherChecked] = useState(false);
  
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
        // Replace old default modules with new templates, keeping user-created ones
        loadedModules = loadedModules.map((m) => {
          if (OLD_DEFAULT_MODULE_NAMES.includes(m.name) && m.name === 'Atelier Projet de Ville 1') {
            return getNewEvaluationModule('standard', 'Cours');
          }
          if (OLD_DEFAULT_MODULE_NAMES.includes(m.name) && m.name === 'Urbanisme') {
            return getNewEvaluationModule('atelier', 'Cours et TD');
          }
          if (OLD_DEFAULT_MODULE_NAMES.includes(m.name)) {
            return getNewEvaluationModule('atelier', 'Atelier');
          }
          return m;
        });
        localStorage.setItem(LOCALSTORAGE_VERSION_KEY, APP_VERSION);
      }

      if (!Array.isArray(loadedModules) || loadedModules.length === 0) {
        loadedModules = [
          getNewEvaluationModule('standard', 'Cours'),
          getNewEvaluationModule('atelier', 'Cours et TD'),
          getNewEvaluationModule('atelier', 'Atelier'),
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
      console.error("Failed to load data from localStorage. This could be due to corrupted data or browser restrictions.", error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les données locales. L'application a été réinitialisée avec les données par défaut.",
      });
      const cours = getNewEvaluationModule('standard', 'Cours');
      const coursEtTD = getNewEvaluationModule('atelier', 'Cours et TD');
      const atelier = getNewEvaluationModule('atelier', 'Atelier');
      setModules([cours, coursEtTD, atelier]);
      setActiveModuleId(cours.id);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const handler = setTimeout(() => {
      try {
        localStorage.setItem(LOCALSTORAGE_MODULES_KEY, JSON.stringify(modules));
        localStorage.setItem(LOCALSTORAGE_ACTIVE_MODULE_ID_KEY, JSON.stringify(activeModuleId));
      } catch (error) {
        console.error("Failed to save data to localStorage:", error);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [modules, activeModuleId, isLoaded]);

  // Vérifier la connexion cloud au montage
  useEffect(() => {
    testConnection().then((status) => {
      setIsCloudConnected(status.connected);
    });
  }, []);

  // Vérifier si l'enseignant est connecté
  useEffect(() => {
    const t = getTeacher();
    setTeacherState(t);
    setTeacherChecked(true);
  }, []);

  // Auto-sync au démarrage si connecté au cloud
  useEffect(() => {
    if (!isLoaded || !isCloudConnected) return;
    const timeout = setTimeout(() => {
      syncBidirectional().then((result) => {
        if (result.success && result.modulesSynced && result.modulesSynced > 0) {
          const modulesJson = localStorage.getItem(LOCALSTORAGE_MODULES_KEY);
          if (modulesJson) {
            setModules(JSON.parse(modulesJson));
          }
        }
      }).catch(() => {});
    }, 2000);
    return () => clearTimeout(timeout);
  }, [isLoaded, isCloudConnected]);

  // Handlers de synchronisation
  const handleSyncToCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await saveToCloud();
      toast({
        title: result.success ? "Synchronisation réussie" : "Erreur",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);

  const handleSyncFromCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await loadFromCloud();
      if (result.success && result.modulesSynced && result.modulesSynced > 0) {
        // Recharger les modules depuis localStorage
        const modulesJson = localStorage.getItem(LOCALSTORAGE_MODULES_KEY);
        if (modulesJson) {
          const loadedModules = JSON.parse(modulesJson);
          setModules(loadedModules);
        }
      }
      toast({
        title: result.success ? "Chargement réussi" : "Erreur",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);

  const handleSyncBidirectional = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncBidirectional();
      if (result.success) {
        // Recharger les modules depuis localStorage
        const modulesJson = localStorage.getItem(LOCALSTORAGE_MODULES_KEY);
        if (modulesJson) {
          const loadedModules = JSON.parse(modulesJson);
          setModules(loadedModules);
        }
      }
      toast({
        title: result.success ? "Synchronisation terminée" : "Erreur",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);



  const activeModule = useMemo(() => modules.find(m => m.id === activeModuleId), [modules, activeModuleId]);

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
  

  // Afficher l'écran de connexion enseignant si pas encore identifié
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
        {/* ═══ Premium Gradient Header ═══ */}
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

                {/* Teacher profile badge */}
                {teacher && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/15" title={`${teacher.name} — ${teacher.email}`}>
                    <div className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center text-[10px] font-bold text-white">
                      {teacher.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs text-white/70 hidden sm:inline max-w-[100px] truncate">
                      {teacher.name.split(' ')[0]}
                    </span>
                  </div>
                )}

                {/* Google Drive Sync */}
                <GoogleDriveSync
                  onDataLoaded={(data) => {
                    if (data.modules && Array.isArray(data.modules)) {
                      setModules(data.modules);
                      if (data.activeModuleId) setActiveModuleId(data.activeModuleId);
                    }
                  }}
                  onGetData={() => ({ modules, activeModuleId })}
                  compact
                />

                {/* Nextcloud Sync */}
                <NextcloudSync
                  onDataLoaded={(data) => {
                    if (data.modules && Array.isArray(data.modules)) {
                      setModules(data.modules);
                      if (data.activeModuleId) setActiveModuleId(data.activeModuleId);
                    }
                  }}
                  onGetData={() => ({ modules, activeModuleId })}
                  compact
                />

                {/* Indicateur de connexion cloud */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/15">
                  {isCloudConnected === null ? (
                    <RefreshCw className="h-3.5 w-3.5 text-white/50 animate-spin" />
                  ) : isCloudConnected ? (
                    <Cloud className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <CloudOff className="h-3.5 w-3.5 text-white/50" />
                  )}
                  <span className="text-xs text-white/70 hidden sm:inline">
                    {isCloudConnected === null ? '...' : isCloudConnected ? 'Cloud' : 'Local'}
                  </span>
                </div>

                <Menubar className="bg-white/10 border-white/15 text-white hover:bg-white/15">
                  <MenubarMenu>
                    <MenubarTrigger className="text-white/90 hover:text-white data-[state=open]:bg-white/15">
                      <FolderPlus className="mr-1.5 h-4 w-4" />
                      Fichier
                    </MenubarTrigger>
                    <MenubarContent>
                      <NewModuleDialog onCreate={handleCreateModule} />
                      <MenubarSeparator />
                      <MenubarItem onClick={handleSyncBidirectional} disabled={isSyncing || !isCloudConnected}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Synchroniser avec Cloud
                      </MenubarItem>
                      <MenubarItem onClick={handleSyncToCloud} disabled={isSyncing || !isCloudConnected}>
                        <Upload className="mr-2 h-4 w-4" />
                        Envoyer vers Cloud
                      </MenubarItem>
                      <MenubarItem onClick={handleSyncFromCloud} disabled={isSyncing || !isCloudConnected}>
                        <Download className="mr-2 h-4 w-4" />
                        Charger depuis Cloud
                      </MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem onClick={async () => {
                        const result = await saveToGoogleDrive({ modules, activeModuleId });
                        toast({ title: result.success ? "Sauvegardé" : "Erreur", description: result.message, variant: result.success ? "default" : "destructive" });
                      }}>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Sauvegarder sur Google Drive
                      </MenubarItem>
                      <MenubarItem onClick={async () => {
                        const result = await loadFromGoogleDrive();
                        if (result.success && result.data?.modules) {
                          setModules(result.data.modules);
                          if (result.data.activeModuleId) setActiveModuleId(result.data.activeModuleId);
                        }
                        toast({ title: result.success ? "Chargé" : "Erreur", description: result.message, variant: result.success ? "default" : "destructive" });
                      }}>
                        <HardDrive className="mr-2 h-4 w-4" />
                        Charger depuis Google Drive
                      </MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem onClick={async () => {
                        const result = await saveToGoogleDrive({ modules, activeModuleId });
                        toast({ title: result.success ? "Sauvegardé" : "Erreur", description: result.message, variant: result.success ? "default" : "destructive" });
                      }}>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Sauvegarder sur Google Drive
                      </MenubarItem>
                      <MenubarItem onClick={async () => {
                        const result = await loadFromGoogleDrive();
                        if (result.success && result.data?.modules) {
                          setModules(result.data.modules);
                          if (result.data.activeModuleId) setActiveModuleId(result.data.activeModuleId);
                        }
                        toast({ title: result.success ? "Chargé" : "Erreur", description: result.message, variant: result.success ? "default" : "destructive" });
                      }}>
                        <HardDrive className="mr-2 h-4 w-4" />
                        Charger depuis Google Drive
                      </MenubarItem>

                      {modules.length > 1 && (
                        <>
                          <MenubarSeparator />
                          <MenubarItem onClick={() => handleDeleteModule(activeModule.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer le module actif
                          </MenubarItem>
                        </>
                      )}
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ Module Tabs Bar ═══ */}
        <div className="bg-card border-b sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-2 overflow-x-auto">
              {modules.map(module => (
                <button
                  key={module.id}
                  onClick={() => setActiveModuleId(module.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    module.id === activeModuleId
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <BookCopy className="h-4 w-4" />
                  {module.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    module.type === 'atelier' ? 'badge-atelier' : 'badge-matiere'
                  }`}>
                    {module.type === 'atelier' ? 'ATELIER' : 'MATIÈRE'}
                  </span>
                </button>
              ))}
              <NewModuleDialog
                onCreate={handleCreateModule}
                trigger={
                  <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-dashed border-border">
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

        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <EvaluationModule
                key={activeModule.id}
                module={activeModule}
                onUpdate={(update) => handleUpdateModule(activeModule.id, update)}
            />
          
            <PwaInstallBanner />

            <footer className="text-center text-sm text-muted-foreground py-8 border-t">
                <p>&copy; {new Date().getFullYear()} GradeAssist. Tous droits réservés.</p>
                <p className="mt-1">Données sauvegardées localement. {modules.length} module(s) au total.</p>
            </footer>
        </div>
    </div>
  );
}
