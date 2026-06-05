
"use client";

import type * as React from 'react';
import { useRef } from 'react';
import Image from 'next/image';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, PlusCircle, MinusCircle, ImageUp, XCircle, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentProjectInfoFormProps {
  studentNames: string[];
  setStudentNames: (names: string[]) => void;
  teacherNames: string[];
  setTeacherNames: (names: string[]) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  studyLevel: string;
  setStudyLevel: (level: string) => void;
  studySubLevel: string;
  setStudySubLevel: (subLevel: string) => void;
  session: string;
  setSession: (session: string) => void;
  academicYear: string;
  setAcademicYear: (year: string) => void;
  universityName: string;
  setUniversityName: (name: string) => void;
  establishmentName: string;
  setEstablishmentName: (name: string) => void;
  departmentName: string;
  setDepartmentName: (name: string) => void;
  masterSpecialty: string;
  setMasterSpecialty: (specialty: string) => void;
  universityLogo: string | null;
  setUniversityLogo: (logo: string | null) => void;
  evaluationSheetTitleComplement: string;
  setEvaluationSheetTitleComplement: (complement: string) => void;
}

const MAX_TEACHERS = 3;
const PLACEHOLDER_SESSION_VALUE = "__SELECT_LEVEL_FIRST__";
const BASE_EVALUATION_TITLE_PREFIX = "Fiche d'évaluation des travaux de l'atelier";


export function StudentProjectInfoForm({
  studentNames,
  setStudentNames,
  teacherNames,
  setTeacherNames,
  projectName,
  setProjectName,
  studyLevel,
  setStudyLevel,
  studySubLevel,
  setStudySubLevel,
  session,
  setSession,
  academicYear,
  setAcademicYear,
  universityName,
  setUniversityName,
  establishmentName,
  setEstablishmentName,
  departmentName,
  setDepartmentName,
  masterSpecialty,
  setMasterSpecialty,
  universityLogo,
  setUniversityLogo,
  evaluationSheetTitleComplement,
  setEvaluationSheetTitleComplement,
}: StudentProjectInfoFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleStudentNameChange = (index: number, value: string) => {
    const newNames = [...studentNames];
    newNames[index] = value;
    setStudentNames(newNames);
  };

  const handleAddStudentField = () => {
    setStudentNames([...studentNames, ""]);
  };

  const handleRemoveStudentField = (index: number) => {
    if (studentNames.length > 1) {
      const newNames = studentNames.filter((_, i) => i !== index);
      setStudentNames(newNames);
    }
  };

  const handleTeacherNameChange = (index: number, value: string) => {
    const newNames = [...teacherNames];
    newNames[index] = value;
    setTeacherNames(newNames);
  };

  const handleAddTeacherField = () => {
    if (teacherNames.length < MAX_TEACHERS) {
      setTeacherNames([...teacherNames, ""]);
    }
  };

  const handleRemoveTeacherField = (index: number) => {
    if (teacherNames.length > 1) {
      const newNames = teacherNames.filter((_, i) => i !== index);
      setTeacherNames(newNames);
    }
  };


  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          toast({
            variant: "destructive",
            title: "Erreur Fichier Excel",
            description: "Le fichier Excel ne contient aucune feuille.",
          });
          return;
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!Array.isArray(excelRows) || excelRows.length <= 1) { 
           toast({
            variant: "warning",
            title: "Fichier Excel Vide",
            description: "Aucun nom d'étudiant trouvé dans le fichier (après l'en-tête).",
          });
           return;
        }
        
        const extractedNames = excelRows
          .slice(1) // Skip header row
          .map((row: any) => {
            if (Array.isArray(row)) {
              const col0 = String(row[0] ?? '').trim();
              const col1 = String(row[1] ?? '').trim();
              if (col0 && col1) return `${col0} ${col1}`;
              return col0 || col1;
            }
            return null;
          })
          .filter((name): name is string => name !== null && name.length > 0);

        if (extractedNames.length === 0) {
          toast({
            variant: "warning",
            title: "Aucun Nom Trouvé",
            description: "Aucun nom d'étudiant valide trouvé. La liste reste inchangée.",
          });
        } else {
          setStudentNames(extractedNames);
          toast({
            title: "Étudiants Importés",
            description: `${extractedNames.length} étudiant(s) ont été ajoutés à la liste.`,
          });
        }

      } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast({
          variant: "destructive",
          title: "Erreur d'Importation Excel",
          description: "Impossible de lire le fichier Excel.",
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      }
    }
  };

  const handleLogoUploadClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "Veuillez sélectionner un logo de moins de 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUniversityLogo(reader.result as string);
        toast({ title: "Logo importé", description: "Le logo a été chargé." });
      };
      reader.readAsDataURL(file);
    }
    if (logoInputRef.current) logoInputRef.current.value = "";
  };
  
  const handleRemoveLogo = () => {
    setUniversityLogo(null);
    toast({ title: "Logo supprimé", description: "Le logo a été retiré." });
  };


  const licenceSessions = ["S1", "S2", "S3", "S4", "S5", "S6"];
  const masterSessions = ["S1", "S2", "S3"]; 
  const availableSessions = studyLevel === "Licence" ? licenceSessions : studyLevel === "Master" ? masterSessions : [];
  
  const licenceSubLevels = [
    { value: 'L1', label: '1ère Année (L1)' },
    { value: 'L2', label: '2ème Année (L2)' },
    { value: 'L3', label: '3ème Année (L3)' },
  ];
  const masterSubLevels = [
    { value: 'M1', label: '1ère Année (M1)' },
    { value: 'M2', label: '2ème Année (M2)' },
  ];
  const availableSubLevels = studyLevel === "Licence" ? licenceSubLevels : studyLevel === "Master" ? masterSubLevels : [];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Informations Générales</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
            <Label htmlFor="evaluationSheetTitleComplement">
              {BASE_EVALUATION_TITLE_PREFIX}
            </Label>
            <Input
              id="evaluationSheetTitleComplement"
              value={evaluationSheetTitleComplement}
              onChange={(e) => setEvaluationSheetTitleComplement(e.target.value)}
              placeholder="Compléter ici (ex: Session Printemps 2024 - Groupe A)"
            />
        </div>

        <div className="space-y-2">
          <Label htmlFor="universityName">Nom de l'université</Label>
          <Input
            id="universityName"
            value={universityName}
            onChange={(e) => setUniversityName(e.target.value)}
            placeholder="Entrez le nom de l'université"
          />
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="universityLogoInput">Logo de l'université</Label>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleLogoUploadClick}
                    className="w-full"
                >
                    <ImageUp className="mr-2 h-4 w-4" />
                    {universityLogo ? "Changer le logo" : "Uploader le logo"}
                </Button>
                <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoFileChange}
                    accept="image/png, image/jpeg, image/svg+xml"
                    style={{ display: 'none' }}
                />
                {universityLogo && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveLogo}
                    >
                        <XCircle className="h-5 w-5 text-destructive" />
                    </Button>
                )}
            </div>
            {universityLogo && (
            <div className="mt-2 p-2 border rounded-md flex justify-center items-center bg-muted/30 aspect-video max-h-32">
                <Image
                src={universityLogo}
                alt="Logo"
                width={100}
                height={100}
                className="object-contain rounded"
                />
            </div>
            )}
        </div>


        <div className="space-y-2">
          <Label htmlFor="establishmentName">Nom de l'établissement</Label>
          <Input
            id="establishmentName"
            value={establishmentName}
            onChange={(e) => setEstablishmentName(e.target.value)}
            placeholder="Faculté / Institut"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="departmentName">Département</Label>
          <Input
            id="departmentName"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            placeholder="Nom du département"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="studyLevel">Niveau d'étude</Label>
          <Select
            value={studyLevel}
            onValueChange={(value) => {
              setStudyLevel(value);
              setSession(""); 
              setStudySubLevel("");
              if (value !== "Master") setMasterSpecialty(""); 
            }}
          >
            <SelectTrigger id="studyLevel">
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Licence">Licence</SelectItem>
              <SelectItem value="Master">Master</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {availableSubLevels.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="studySubLevel">Année</Label>
            <Select
              value={studySubLevel}
              onValueChange={setStudySubLevel}
            >
              <SelectTrigger id="studySubLevel">
                <SelectValue placeholder="Choisir l'année" />
              </SelectTrigger>
              <SelectContent>
                {availableSubLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {studyLevel === "Master" && (
          <div className="space-y-2">
            <Label htmlFor="masterSpecialty">Spécialité du Master</Label>
            <Input
              id="masterSpecialty"
              value={masterSpecialty}
              onChange={(e) => setMasterSpecialty(e.target.value)}
              placeholder="Spécialité"
            />
          </div>
        )}

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Liste des Étudiants</Label>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFileUploadClick}
                >
                    <Upload className="mr-2 h-4 w-4" /> Importer (Excel)
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    style={{ display: "none" }}
                />
            </div>
          </div>
          <div className="grid gap-3">
          {studentNames.map((name, index) => (
            <div key={`student-${index}`} className="flex items-center gap-2">
              <Input
                  value={name}
                  onChange={(e) => handleStudentNameChange(index, e.target.value)}
                  placeholder={`Nom Étudiant ${index + 1}`}
              />
              {studentNames.length > 1 && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStudentField(index)}
                >
                    <MinusCircle className="h-5 w-5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          </div>
          
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStudentField}
              className="w-full sm:w-auto"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un étudiant
            </Button>
          
        </div>

        <div className="md:col-span-2 space-y-4">
          <Label>Enseignants</Label>
          <div className="grid gap-3">
          {teacherNames.map((name, index) => (
            <div key={`teacher-${index}`} className="flex items-center gap-2">
              <Input
                  value={name}
                  onChange={(e) => handleTeacherNameChange(index, e.target.value)}
                  placeholder={`Nom Enseignant ${index + 1}`}
              />
              {teacherNames.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTeacherField(index)}
                >
                  <UserMinus className="h-5 w-5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          </div>
          {teacherNames.length < MAX_TEACHERS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTeacherField}
              className="w-full sm:w-auto"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Ajouter un enseignant
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="projectName">Intitulé du Projet</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Nom du projet"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="session">Session (Semestre)</Label>
          <Select
            value={session || (availableSessions.length > 0 ? "" : PLACEHOLDER_SESSION_VALUE)}
            onValueChange={(value) => {
              if (value !== PLACEHOLDER_SESSION_VALUE) setSession(value)
            }}
            disabled={availableSessions.length === 0}
          >
            <SelectTrigger id="session">
              <SelectValue placeholder="Choisir le semestre" />
            </SelectTrigger>
            <SelectContent>
              {availableSessions.length > 0 ? (
                availableSessions.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))
              ) : (
                <SelectItem value={PLACEHOLDER_SESSION_VALUE} disabled>
                  Niveau non sélectionné
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="academicYear">Année Universitaire</Label>
          <Input
            id="academicYear"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="Ex: 2024-2025"
          />
        </div>
      </CardContent>
    </Card>
  );
}
