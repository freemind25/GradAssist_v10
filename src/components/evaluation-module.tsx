
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
import { AlertCircle, BookOpen, FilePlus2, GraduationCap, MinusCircle, PlusCircle, Route, Settings, UserCheck, UserPlus, Users } from 'lucide-react';
import { AttendanceRegistry } from './attendance-registry';
import { ThesisSupervision } from './thesis-supervision';
import { SyllabusTracker } from './syllabus-tracker';
import { SummaryExportButtons } from './summary-export-buttons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SidebarTab = 'info' | 'evaluation' | 'attendance' | 'encadrement' | 'canevas';

interface EvaluationModuleProps {
    module: EvaluationModuleType;
    onUpdate: (update: Partial<EvaluationData>) => void;
}

export function EvaluationModule({ module, onUpdate }: EvaluationModuleProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<SidebarTab>('evaluation');
    const [allSavedEvaluations, setAllSavedEvaluations] = useState<EvaluationData[]>([]);

    // Ensure thesisStudents exists (backwards compat)
    const thesisStudents = module.evaluationData.thesisStudents ?? [];

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
            thesisStudents: [],
        };

        onUpdate(defaultData);

        toast({
            title: "Évaluation Ajoutée à la Synthèse",
            description: "Le formulaire a été réinitialisé pour une nouvelle saisie.",
        });
    };

    const gradePercentage = useMemo(() => {
        if (module.type !== 'atelier') return 0;
        return Math.min((module.evaluationData.totalPoints / TARGET_SUM_COEFFICIENTS) * 100, 100);
    }, [module.type, module.evaluationData.totalPoints]);

    const getGradeColor = (pct: number) => {
        if (pct >= 80) return 'text-emerald-600';
        if (pct >= 60) return 'text-accent';
        if (pct >= 40) return 'text-orange-500';
        return 'text-destructive';
    };

    const getGradeBg = (pct: number) => {
        if (pct >= 80) return 'bg-emerald-50 border-emerald-200';
        if (pct >= 60) return 'bg-amber-50 border-amber-200';
        if (pct >= 40) return 'bg-orange-50 border-orange-200';
        return 'bg-red-50 border-red-200';
    };

    const sidebarItems: { id: SidebarTab; label: string; icon: React.ElementType }[] = [
        { id: 'info', label: 'Informations', icon: Settings },
        { id: 'evaluation', label: 'Évaluation', icon: GraduationCap },
        { id: 'attendance', label: 'Présences', icon: UserCheck },
        { id: 'encadrement', label: 'Encadrement', icon: BookOpen },
        { id: 'canevas', label: 'Canevas', icon: Route },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* ═══ Sidebar Navigation ═══ */}
            <nav className="lg:w-56 shrink-0">
                <div className="bg-card rounded-xl border card-premium overflow-hidden sticky top-20">
                    <div className="p-3 space-y-1">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "neon-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                                        isActive ? "neon-btn-active" : ""
                                    )}
                                >
                                    {/* Glow borders */}
                                    <div className="neon-btn-glow neon-btn-glow-left" />
                                    <div className="neon-btn-glow neon-btn-glow-right" />
                                    <div className="neon-btn-glow neon-btn-glow-top" />
                                    <div className="neon-btn-glow neon-btn-glow-bottom" />
                                    <span className="neon-btn-text">
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* ═══ Content Area ═══ */}
            <div className="flex-1 min-w-0 space-y-6">

                {/* ── Tab: Informations Générales ── */}
                {activeTab === 'info' && (
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
                        adminEmail={module.evaluationData.adminEmail}
                        setAdminEmail={(value) => updateField('adminEmail', value)}
                    />
                )}

                {/* ── Tab: Évaluation ── */}
                {activeTab === 'evaluation' && (
                    <>
                    {/* ═══ Étudiants évalués ═══ */}
                    <Card className="card-premium overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Étudiants évalués
                            </CardTitle>
                            <CardDescription>
                                Ajoutez les noms des étudiants à évaluer pour ce module.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid gap-2">
                                {module.evaluationData.studentNames.map((name, index) => (
                                    <div key={`eval-student-${index}`} className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-5 text-right font-mono">{index + 1}.</span>
                                        <input
                                            value={name}
                                            onChange={(e) => {
                                                const newNames = [...module.evaluationData.studentNames];
                                                newNames[index] = e.target.value;
                                                updateField('studentNames', newNames);
                                            }}
                                            placeholder={`Nom de l'étudiant ${index + 1}`}
                                            className="flex-1 h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                        />
                                        {module.evaluationData.studentNames.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    const newNames = module.evaluationData.studentNames.filter((_, i) => i !== index);
                                                    updateField('studentNames', newNames);
                                                }}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                <MinusCircle className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => updateField('studentNames', [...module.evaluationData.studentNames, ""])}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-dashed border-border w-full justify-center"
                            >
                                <UserPlus className="h-4 w-4" />
                                Ajouter un étudiant
                            </button>
                        </CardContent>
                    </Card>
                        {module.type === 'atelier' ? (
                            <>
                            {/* ═══ Grade Summary Banner ═══ */}
                            <div className={`rounded-xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 ${getGradeBg(gradePercentage)} card-premium`}>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-border" strokeWidth="3" />
                                            <circle
                                                cx="18" cy="18" r="15" fill="none" stroke="currentColor"
                                                className={getGradeColor(gradePercentage)}
                                                strokeWidth="3"
                                                strokeDasharray="94.25"
                                                strokeDashoffset={94.25 - (94.25 * gradePercentage) / 100}
                                                strokeLinecap="round"
                                                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className={`text-lg font-extrabold ${getGradeColor(gradePercentage)}`}>{Math.round(gradePercentage)}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Note Finale</p>
                                        <p className="text-3xl font-extrabold text-foreground">
                                            {module.evaluationData.totalPoints.toFixed(2)}
                                            <span className="text-lg font-normal text-muted-foreground"> / {TARGET_SUM_COEFFICIENTS.toFixed(2)}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
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
                                </div>
                            </div>

                            {/* ═══ Grille d'évaluation ═══ */}
                            <Card className="card-premium overflow-hidden">
                                <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Grille d&apos;Évaluation
                                    </CardTitle>
                                    <CardDescription>
                                        Attribuez une note pour chaque critère. La somme des coefficients devrait être {TARGET_SUM_COEFFICIENTS}.
                                    </CardDescription>
                                    {currentCoefficientSum !== TARGET_SUM_COEFFICIENTS && (
                                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            Coefficients : {currentCoefficientSum.toFixed(2)} / {TARGET_SUM_COEFFICIENTS} (objectif)
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className='space-y-4 pt-2'>
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
                                     <Button onClick={handleAddCriterion} variant="outline" size="sm" className="border-dashed">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Ajouter un critère
                                    </Button>
                                </CardContent>
                            </Card>
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

                        {/* ═══ Synthèse ═══ */}
                        <Card className="card-premium overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-accent via-primary to-accent" />
                            <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FilePlus2 className="h-5 w-5 text-accent" />
                                    Synthèse des Évaluations
                                </CardTitle>
                                <CardDescription>
                                    Ajoutez l&apos;évaluation actuelle à la synthèse, puis réinitialisez pour une nouvelle saisie.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap items-center gap-4">
                                 <Button onClick={handleAddToSummaryAndReset} className="bg-accent hover:bg-accent/90 text-accent-foreground">
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
                                <CardFooter className="border-t bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <p className="text-sm text-muted-foreground font-medium">{allSavedEvaluations.length} évaluation(s) sauvegardée(s) dans la synthèse</p>
                                    </div>
                                </CardFooter>
                            )}
                        </Card>
                    </>
                )}

                {/* ── Tab: Encadrement (available for ALL module types) ── */}
                {activeTab === 'encadrement' && (
                    <ThesisSupervision
                        thesisStudents={thesisStudents}
                        setThesisStudents={(value) => updateField('thesisStudents', value)}
                    />
                )}

                {/* ── Tab: Canevas du Cours ── */}
                {activeTab === 'canevas' && (
                    <SyllabusTracker
                        syllabus={module.evaluationData.syllabus}
                        setSyllabus={(value) => updateField('syllabus', value)}
                        moduleName={module.name}
                    />
                )}

                {/* ── Tab: Présences (available for ALL module types) ── */}
                {activeTab === 'attendance' && (
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
                        adminEmail={module.evaluationData.adminEmail}
                        setAdminEmail={(value) => updateField('adminEmail', value)}
                    />
                )}
            </div>
        </div>
    );
}

    