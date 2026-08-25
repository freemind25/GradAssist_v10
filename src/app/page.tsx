
"use client";

import type * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from "react";
import { BookCopy, Plus, FolderPlus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_CRITERIA, TARGET_SUM_COEFFICIENTS } from "@/config/grading-config";
import type { EvaluationData, EvaluationModule as EvaluationModuleType, ModuleType } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EvaluationModule } from '@/components/evaluation-module';
import { HelpGuideDialog } from '@/components/help-guide-dialog';
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
              placeholder="Ex: Projet de ville 1"
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
  const { toast } = useToast();

  useEffect(() => {
    try {
      const modulesData = localStorage.getItem(LOCALSTORAGE_MODULES_KEY);
      const activeIdData = localStorage.getItem(LOCALSTORAGE_ACTIVE_MODULE_ID_KEY);
      
      let loadedModules: EvaluationModuleType[] = [];
      if (modulesData) {
        loadedModules = JSON.parse(modulesData);
      }
      
      if (!Array.isArray(loadedModules) || loadedModules.length === 0) {
        loadedModules = [getNewEvaluationModule('atelier', 'Atelier Projet de Ville 1')];
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
      const defaultModule = getNewEvaluationModule('atelier', 'Atelier Projet de Ville 1');
      setModules([defaultModule]);
      setActiveModuleId(defaultModule.id);
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
                  <p className="text-xs text-white/60 font-medium mt-0.5">Application d&apos;Évaluation Modulaire · Designed by M.SADI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HelpGuideDialog />
                <Menubar className="bg-white/10 border-white/15 text-white hover:bg-white/15">
                  <MenubarMenu>
                    <MenubarTrigger className="text-white/90 hover:text-white data-[state=open]:bg-white/15">
                      <FolderPlus className="mr-1.5 h-4 w-4" />
                      Fichier
                    </MenubarTrigger>
                    <MenubarContent>
                      <NewModuleDialog onCreate={handleCreateModule} />
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
          
            <footer className="text-center text-sm text-muted-foreground py-8 border-t">
                <p>&copy; {new Date().getFullYear()} GradeAssist. Tous droits réservés.</p>
                <p className="mt-1">Données sauvegardées localement. {modules.length} module(s) au total.</p>
            </footer>
        </div>
    </div>
  );
}
