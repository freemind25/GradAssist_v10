
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
    },
  };

  if (type === 'standard') {
    baseModule.evaluationData.continuousAssessmentGrade = 10;
    baseModule.evaluationData.examGrade = 10;
    baseModule.evaluationData.continuousAssessmentWeight = 40;
  }

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
            Choisissez un nom et un type d'évaluation pour votre nouvelle matière ou atelier.
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
        <p>Chargement de l'application...</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 selection:bg-primary/30">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="inline-block bg-card p-4 sm:p-6 rounded-2xl shadow-lg border">
            <div className="flex items-center justify-center gap-4">
                <div className="relative w-[60px] h-[60px] flex items-center justify-center bg-primary/10 rounded-xl overflow-hidden border-2 border-primary/20">
                    <svg
                        width="45"
                        height="45"
                        viewBox="0 0 80 75"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-primary"
                    >
                        <path
                        d="M39.9992 4.16669L4.16589 24.1667L15.2284 30.0768V50.8334L39.9992 64.5834L75.8325 41.6667V20.8334L69.1659 16.9768M39.9992 4.16669L75.8325 24.1667L39.9992 44.1667L4.16589 24.1667M62.4992 55.8334L39.9992 69.5834V49.1667L62.4992 35.4167V55.8334Z"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    <span className='text-foreground'>Grade</span>
                    <span className='text-accent'>Assist</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1 font-bold">Designed by M.SADI</p>
                <p className="text-base sm:text-lg text-muted-foreground mt-1">
                    Application d'Évaluation Modulaire
                </p>
                </div>
            </div>
            </div>
            <div className="w-full sm:w-auto">
                <Menubar>
                    <MenubarMenu>
                        <MenubarTrigger>Fichier</MenubarTrigger>
                        <MenubarContent>
                            <NewModuleDialog onCreate={handleCreateModule} />
                             {modules.length > 1 && (
                                <>
                                <MenubarSeparator />
                                <MenubarItem onClick={() => handleDeleteModule(activeModule.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    Supprimer le module actif
                                </MenubarItem>
                                </>
                            )}
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
            </div>
        </header>

        <div className="space-y-4">
             <Card>
                <CardHeader className='pb-4'>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <BookCopy />
                        Module Actif
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <Select value={activeModuleId || ''} onValueChange={(id) => setActiveModuleId(id)}>
                        <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                            <SelectValue placeholder="Sélectionner une matière..." />
                        </SelectTrigger>
                        <SelectContent>
                            {modules.map(module => (
                                <SelectItem key={module.id} value={module.id}>
                                    {module.name} ({module.type === 'atelier' ? 'Atelier' : 'Matière'})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <NewModuleDialog 
                            onCreate={handleCreateModule} 
                            trigger={
                                <Button variant="outline" className="flex-1 md:flex-none">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouveau
                                </Button>
                            }
                        />
                        
                        {modules.length > 1 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="flex-1 md:flex-none">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action supprimera définitivement le module "{activeModule.name}" et toutes ses données d'évaluation associées.
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
                </CardContent>
            </Card>
        </div>


        <EvaluationModule
            key={activeModule.id}
            module={activeModule}
            onUpdate={(update) => handleUpdateModule(activeModule.id, update)}
        />
      
        <footer className="text-center text-sm text-muted-foreground py-8">
            <p>&copy; {new Date().getFullYear()} GradeAssist. Tous droits réservés.</p>
            <p>Données sauvegardées localement. {modules.length} module(s) au total.</p>
        </footer>
    </div>
  );
}
