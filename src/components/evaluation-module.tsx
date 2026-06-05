
"use client";

import type * as React from 'react';
import { useCallback, useState, useMemo } from 'react';
import type { EvaluationModule as EvaluationModuleType, EvaluationData, Criterion } from '@/types';
import { StudentProjectInfoForm } from '@/components/student-project-info-form';
import { GradeTable } from '@/components/grade-table';
import { StandardModuleForm } from '@/components/standard-module-form';
import { ExportButtons } from '@/components/export-buttons';
import { Button } from '@/components/ui/button';
import { gradeLevels, TARGET_SUM_COEFFICIENTS, DEFAULT_CRITERIA } from '@/config/grading-config';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, FilePlus2, PlusCircle, Save } from 'lucide-react';
import { AttendanceRegistry } from './attendance-registry';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { SummaryExportButtons } from './summary-export-buttons';
import { useToast } from '@/hooks/use-toast';

interface EvaluationModuleProps {
    module: EvaluationModuleType;
    onUpdate: (update: Partial<EvaluationData>) => void;
}

export function EvaluationModule({ module, onUpdate }: EvaluationModuleProps) {
    const { toast } = useToast();
    const [allSavedEvaluations, setAllSavedEvaluations] = useState<EvaluationData[]>([]);

    const updateField = <K extends keyof EvaluationData>(field: K, value: EvaluationData[K]) => {
        onUpdate({ [field]: value });
    };

    const handleUpdateCriterion = (id: string, field: keyof Criterion, value: string | number) => {
        const newCriteria = module.evaluationData.criteria.map(c => {
            if (c.id === id) {
                return { ...c, [field]: value };
            }
            return c;
        });
        updateField('criteria', newCriteria);
    };

    const handleRemoveCriterion = (id: string) => {
        const newCriteria = module.evaluationData.criteria.filter(c => c.id !== id);
        updateField('criteria', newCriteria);
    };
    
    const handleAddCriterion = () => {
        const newCriterion: Criterion = {
            id: `custom_${Date.now()}`,
            name: 'Nouveau critère',
            details: '',
            coefficient: 1,
        };
        const newCriteria = [...module.evaluationData.criteria, newCriterion];
        updateField('criteria', newCriteria);
    };
    
    const currentCoefficientSum = useMemo(() => {
        if (module.type !== 'atelier') return 0;
        return module.evaluationData.criteria.reduce((sum, criterion) => sum + criterion.coefficient, 0);
    }, [module.type, module.evaluationData.criteria]);

    const handleAddToSummaryAndReset = () => {
        // Create a snapshot of the current evaluation data
        const evaluationSnapshot: EvaluationData = { ...module.evaluationData };
        
        // Add to the summary list
        const newSummary = [...allSavedEvaluations, evaluationSnapshot];
        setAllSavedEvaluations(newSummary);

        // Create a fresh default evaluation data object
        const newId = `eval_${Date.now()}`;
        const defaultData: Partial<EvaluationData> = {
            id: newId,
            studentNames: [""],
            projectName: "",
            selectedGrades: {},
            totalPoints: 0,
            // Keep some fields for continuity
            universityName: module.evaluationData.universityName,
            establishmentName: module.evaluationData.establishmentName,
            departmentName: module.evaluationData.departmentName,
            masterSpecialty: module.evaluationData.studyLevel === 'Master' ? module.evaluationData.masterSpecialty : "",
            studyLevel: module.evaluationData.studyLevel,
            studySubLevel: module.evaluationData.studySubLevel,
            session: module.evaluationData.session,
            academicYear: module.evaluationData.academicYear,
            universityLogo: module.evaluationData.universityLogo,
            teacherNames: module.evaluationData.teacherNames,
            criteria: DEFAULT_CRITERIA, // Reset criteria to default
            attendance: {},
        };

        onUpdate(defaultData);

        toast({
            title: "Évaluation Ajoutée à la Synthèse",
            description: "Le formulaire a été réinitialisé pour une nouvelle saisie.",
        });
    };

    return (
        <div className="space-y-8">
            <StudentProjectInfoForm
                studentNames={module.evaluationData.studentNames}
                setStudentNames={(value) => updateField('studentNames', value)}
                teacherNames={module.evaluationData.teacherNames}
                setTeacherNames={(value) => updateField('teacherNames', value)}
                projectName={module.evaluationData.projectName}
                setProjectName={(value) => updateField('projectName', value)}
                studyLevel={module.evaluationData.studyLevel}
                setStudyLevel={(value) => updateField('studyLevel', value)}
                studySubLevel={module.evaluationData.studySubLevel}
                setStudySubLevel={(value) => updateField('studySubLevel', value)}
                session={module.evaluationData.session}
                setSession={(value) => updateField('session', value)}
                academicYear={module.evaluationData.academicYear}
                setAcademicYear={(value) => updateField('academicYear', value)}
                universityName={module.evaluationData.universityName}
                setUniversityName={(value) => updateField('universityName', value)}
                establishmentName={module.evaluationData.establishmentName}
                setEstablishmentName={(value) => updateField('establishmentName', value)}
                departmentName={module.evaluationData.departmentName}
                setDepartmentName={(value) => updateField('departmentName', value)}
                masterSpecialty={module.evaluationData.masterSpecialty}
                setMasterSpecialty={(value) => updateField('masterSpecialty', value)}
                universityLogo={module.evaluationData.universityLogo}
                setUniversityLogo={(value) => updateField('universityLogo', value)}
                evaluationSheetTitleComplement={module.evaluationData.evaluationSheetTitleComplement}
                setEvaluationSheetTitleComplement={(value) => updateField('evaluationSheetTitleComplement', value)}
            />

            {module.type === 'atelier' ? (
                <>
                <Card className="shadow-lg border-t-4 border-accent">
                    <CardHeader>
                        <CardTitle>Grille d'Évaluation de l'Atelier</CardTitle>
                        <CardDescription>
                            Attribuez une note pour chaque critère. Les points sont calculés en fonction du coefficient. La somme des coefficients devrait être {TARGET_SUM_COEFFICIENTS}.
                        </CardDescription>
                         {currentCoefficientSum !== TARGET_SUM_COEFFICIENTS && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Attention</AlertTitle>
                                <AlertDescription>
                                    La somme des coefficients ({currentCoefficientSum.toFixed(2)}) est différente de l'objectif de {TARGET_SUM_COEFFICIENTS}.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <GradeTable
                            criteria={module.evaluationData.criteria}
                            gradeLevels={gradeLevels}
                            selectedGrades={module.evaluationData.selectedGrades}
                            onGradeSelect={(criterionId, gradeValue) => {
                                const newGrades = { ...module.evaluationData.selectedGrades, [criterionId]: gradeValue };
                                updateField('selectedGrades', newGrades);
                            }}
                            onUpdateCriterion={handleUpdateCriterion}
                            onRemoveCriterion={handleRemoveCriterion}
                        />
                         <Button onClick={handleAddCriterion} variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter un critère
                        </Button>
                    </CardContent>
                    <CardFooter className='flex-col items-start gap-4'>
                         <p className="text-xl font-semibold text-foreground">
                            Note Finale: <span className="text-accent-foreground bg-accent px-3 py-1.5 rounded-md text-2xl">{module.evaluationData.totalPoints.toFixed(2)}</span> / {TARGET_SUM_COEFFICIENTS.toFixed(2)}
                        </p>
                        <ExportButtons
                            criteria={module.evaluationData.criteria}
                            gradeLevels={gradeLevels}
                            selectedGrades={module.evaluationData.selectedGrades}
                            studentNames={module.evaluationData.studentNames}
                            teacherNames={module.evaluationData.teacherNames}
                            projectName={module.evaluationData.projectName}
                            studyLevel={module.evaluationData.studyLevel}
                            studySubLevel={module.evaluationData.studySubLevel}
                            session={module.evaluationData.session}
                            academicYear={module.evaluationData.academicYear}
                            universityName={module.evaluationData.universityName}
                            establishmentName={module.evaluationData.establishmentName}
                            departmentName={module.evaluationData.departmentName}
                            masterSpecialty={module.evaluationData.masterSpecialty}
                            universityLogo={module.evaluationData.universityLogo}
                            totalPoints={module.evaluationData.totalPoints}
                            maxTotalPoints={TARGET_SUM_COEFFICIENTS}
                            evaluationSheetTitleComplement={module.evaluationData.evaluationSheetTitleComplement}
                        />
                    </CardFooter>
                </Card>
                <div className="space-y-4">
                    <AttendanceRegistry
                        students={module.evaluationData.studentNames}
                        attendance={module.evaluationData.attendance}
                        setAttendance={(value) => updateField('attendance', value)}
                        establishmentName={module.evaluationData.establishmentName}
                        departmentName={module.evaluationData.departmentName}
                        studyLevel={module.evaluationData.studyLevel}
                        studySubLevel={module.evaluationData.studySubLevel}
                        teacherNames={module.evaluationData.teacherNames}
                        universityLogo={module.evaluationData.universityLogo}
                        moduleName={module.name}
                    />
                </div>
                </>
            ) : (
                <StandardModuleForm
                    continuousAssessmentGrade={module.evaluationData.continuousAssessmentGrade ?? 10}
                    setContinuousAssessmentGrade={(value) => updateField('continuousAssessmentGrade', value)}
                    examGrade={module.evaluationData.examGrade ?? 10}
                    setExamGrade={(value) => updateField('examGrade', value)}
                    continuousAssessmentWeight={module.evaluationData.continuousAssessmentWeight ?? 40}
                    setContinuousAssessmentWeight={(value) => updateField('continuousAssessmentWeight', value)}
                />
            )}
             <Card>
                <CardHeader>
                    <CardTitle>Synthèse des Évaluations</CardTitle>
                    <CardDescription>
                        Ajoutez l'évaluation actuelle à la synthèse pour la sauvegarder, puis réinitialisez le formulaire pour une nouvelle saisie.
                        Vous pourrez ensuite exporter la synthèse complète.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                     <Button onClick={handleAddToSummaryAndReset}>
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Ajouter à la Synthèse et Réinitialiser
                    </Button>
                     {allSavedEvaluations.length > 0 && (
                        <SummaryExportButtons
                            allEvaluations={allSavedEvaluations}
                            maxTotalPoints={TARGET_SUM_COEFFICIENTS}
                            moduleName={module.name}
                        />
                    )}
                </CardContent>
                 {allSavedEvaluations.length > 0 && (
                    <CardFooter>
                        <p className="text-sm text-muted-foreground">{allSavedEvaluations.length} évaluation(s) dans la synthèse.</p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

    