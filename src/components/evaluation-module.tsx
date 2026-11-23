
"use client";

import type * as React from 'react';
import { useCallback, useState, useMemo } from 'react';
import type { EvaluationModule as EvaluationModuleType, EvaluationData, Criterion, StudentResult, StudentResultCriterion } from '@/types';
import { StudentProjectInfoForm } from '@/components/student-project-info-form';
import { GradeTable } from '@/components/grade-table';
import { StandardModuleForm } from '@/components/standard-module-form';
import { ExportButtons } from '@/components/export-buttons';
import { Button } from '@/components/ui/button';
import { gradeLevels, TARGET_SUM_COEFFICIENTS, DEFAULT_CRITERIA } from '@/config/grading-config';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, AlertTriangle, BarChart3, BookOpen, FilePlus2, FileText, GraduationCap, MinusCircle, PlusCircle, Route, Settings, UserCheck, UserPlus, Users } from 'lucide-react';
import { AttendanceRegistry } from './attendance-registry';
import { ThesisSupervision } from './thesis-supervision';
import { SyllabusTracker } from './syllabus-tracker';
import { SummaryExportButtons } from './summary-export-buttons';
import { PvExport } from './pv-export';
import { AiAssistant } from './ai-assistant';
import { AnalyticsDashboard } from './analytics-dashboard';
import { AtRiskStudents } from './at-risk-students';
import { QuickNotes } from './quick-notes';
import { WorkGroups } from './work-groups';
import { TutoringTracker } from './tutoring-tracker';
import { PedagogicalReports } from './pedagogical-reports';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Save } from 'lucide-react';

type SidebarTab = 'info' | 'evaluation' | 'attendance' | 'encadrement' | 'canevas' | 'dashboard' | 'alerts' | 'tutoring' | 'reports';

interface EvaluationModuleProps {
    module: EvaluationModuleType;
    onUpdate: (update: Partial<EvaluationData>) => void;
    onSave?: () => void;
}

export function EvaluationModule({ module, onUpdate, onSave }: EvaluationModuleProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<SidebarTab>('evaluation');
    const [allSavedEvaluations, setAllSavedEvaluations] = useState<EvaluationData[]>([]);
    // Résultat en attente de vérification : rien n'est enregistré tant que
    // l'utilisateur n'a pas validé l'écran de consultation.
    const [pendingReview, setPendingReview] = useState<StudentResult | null>(null);

    // Ensure backwards compatibility for new fields
    const thesisStudents = module.evaluationData.thesisStudents ?? [];
    const quickNotes = module.evaluationData.quickNotes ?? [];
    const workGroups = module.evaluationData.workGroups ?? [];
    const atRiskConfig = module.evaluationData.atRiskConfig ?? { attendanceThreshold: 75, gradeThreshold: 10 };
    const tutoringSessions = module.evaluationData.tutoringSessions ?? [];

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

    const studentResults = useMemo(
        () => module.evaluationData.studentResults ?? [],
        [module.evaluationData.studentResults]
    );

    /** Construit le résultat de l'étudiant courant, sans rien enregistrer. */
    const buildStudentResult = useCallback((): StudentResult | null => {
        const d = module.evaluationData;
        const studentName = d.studentNames.map((n) => n.trim()).filter(Boolean).join(" & ");

        if (!studentName) {
            toast({
                variant: "destructive",
                title: "Étudiant manquant",
                description: "Renseignez au moins un nom d'étudiant avant d'enregistrer un résultat.",
            });
            return null;
        }

        if (module.type === 'atelier') {
            const criteria: StudentResultCriterion[] = d.criteria.map((c) => {
                const raw = d.selectedGrades[c.id];
                const hasGrade = Boolean(raw) && raw !== "__NONE__";
                const points = hasGrade ? Number.parseFloat(raw as string) : 0;
                return {
                    criterionId: c.id,
                    name: c.name,
                    coefficient: c.coefficient,
                    grade: hasGrade ? (raw as string) : "",
                    points: Number.isFinite(points) ? points : 0,
                };
            });

            return {
                id: `res_${Date.now()}`,
                studentName,
                moduleType: module.type,
                totalPoints: d.totalPoints,
                maxPoints: TARGET_SUM_COEFFICIENTS,
                criteria,
                savedAt: new Date().toISOString(),
            };
        }

        // Matière classique / MOOC : note finale = CC × poids + Examen × (1 − poids)
        const cc = d.continuousAssessmentGrade ?? 0;
        const exam = d.examGrade ?? 0;
        const weight = d.continuousAssessmentWeight ?? 40;
        const finalGrade = cc * (weight / 100) + exam * ((100 - weight) / 100);

        return {
            id: `res_${Date.now()}`,
            studentName,
            moduleType: module.type,
            totalPoints: finalGrade,
            maxPoints: 20,
            continuousAssessment: cc,
            exam,
            continuousAssessmentWeight: weight,
            savedAt: new Date().toISOString(),
        };
    }, [module, toast]);

    /** Étape 1 : ouvre l'écran de vérification, sans écrire quoi que ce soit. */
    const handlePrepareResult = useCallback(() => {
        const result = buildStudentResult();
        if (result) setPendingReview(result);
    }, [buildStudentResult]);

    /** Étape 3 : réinitialise le formulaire pour la saisie suivante. */
    const resetEvaluationForm = useCallback(() => {
        const defaultData: Partial<EvaluationData> = {
            id: `eval_${Date.now()}`,
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
    }, [module.evaluationData, onUpdate]);

    /** Étape 2 : validation depuis l'écran de consultation. */
    const confirmResult = useCallback(() => {
        if (!pendingReview) return;

        // Un même étudiant ne doit avoir qu'un résultat : une nouvelle
        // validation corrige le précédent au lieu de le dupliquer.
        const others = studentResults.filter((r) => r.studentName !== pendingReview.studentName);
        onUpdate({ studentResults: [...others, pendingReview] });

        // La synthèse en mémoire reste alimentée pour les exports existants.
        setAllSavedEvaluations((prev) => [...prev, { ...module.evaluationData }]);

        resetEvaluationForm();
        setPendingReview(null);

        toast({
            title: "Résultat enregistré",
            description: `${pendingReview.studentName} — ${pendingReview.totalPoints.toFixed(2)} / ${pendingReview.maxPoints}.`,
        });
    }, [pendingReview, studentResults, onUpdate, module.evaluationData, resetEvaluationForm, toast]);

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
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'alerts', label: 'Alertes', icon: AlertTriangle },
        { id: 'tutoring', label: 'Tutorat', icon: GraduationCap },
        { id: 'reports', label: 'Rapports', icon: FileText },
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
                    {/* Save Button */}
                    <div className="p-3 border-t">
                        <button
                            onClick={() => {
                                if (onSave) {
                                    onSave();
                                }
                                toast({ title: "Sauvegardé", description: "Les données ont été sauvegardées avec succès." });
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </nav>                {/* ═══ Content Area ═══ */}
            <div className="flex-1 min-w-0 space-y-6">
                {/* ═══ AI Assistant ═══ */}
                <div className="flex justify-end">
                    <AiAssistant
                        evaluationData={module.evaluationData}
                        moduleName={module.name}
                        moduleType={module.type}
                    />
                </div>

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
                                    <PvExport
                                        evaluationData={module.evaluationData}
                                        moduleName={module.name}
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
                                    Vérifiez le résultat de l&apos;étudiant avant de l&apos;enregistrer définitivement, puis réinitialisez pour la saisie suivante.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap items-center gap-4">
                                 <Button onClick={handlePrepareResult} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                    <FilePlus2 className="mr-2 h-4 w-4" />
                                    Vérifier et enregistrer
                                </Button>
                                 {allSavedEvaluations.length > 0 && (
                                    <SummaryExportButtons
                                        allEvaluations={allSavedEvaluations}
                                        maxTotalPoints={TARGET_SUM_COEFFICIENTS}
                                        moduleName={module.name}
                                    />
                                )}
                                {studentResults.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {studentResults.length} résultat(s) enregistré(s) pour ce module
                                    </p>
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

                        {/* Écran de vérification : rien n'est écrit avant validation */}
                        <Dialog
                            open={pendingReview !== null}
                            onOpenChange={(open) => {
                                if (!open) setPendingReview(null);
                            }}
                        >
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Vérifier avant enregistrement</DialogTitle>
                                    <DialogDescription>
                                        Contrôlez le résultat ci-dessous. Aucune donnée n&apos;est enregistrée tant que vous n&apos;avez pas validé.
                                    </DialogDescription>
                                </DialogHeader>

                                {pendingReview && (
                                    <div className="space-y-4">
                                        <div className="flex items-baseline justify-between rounded-lg border bg-muted/30 px-4 py-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Étudiant</p>
                                                <p className="font-semibold">{pendingReview.studentName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Note</p>
                                                <p className="text-2xl font-bold text-accent">
                                                    {pendingReview.totalPoints.toFixed(2)}
                                                    <span className="text-sm font-normal text-muted-foreground"> / {pendingReview.maxPoints}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {pendingReview.criteria && pendingReview.criteria.length > 0 && (
                                            <div className="max-h-64 overflow-y-auto rounded-lg border">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50 text-left">
                                                        <tr>
                                                            <th className="px-3 py-2">Critère</th>
                                                            <th className="px-3 py-2 text-center">Coeff.</th>
                                                            <th className="px-3 py-2 text-center">Note</th>
                                                            <th className="px-3 py-2 text-center">Points</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pendingReview.criteria.map((c) => (
                                                            <tr key={c.criterionId} className="border-t">
                                                                <td className="px-3 py-1.5">{c.name}</td>
                                                                <td className="px-3 py-1.5 text-center">{c.coefficient}</td>
                                                                <td className="px-3 py-1.5 text-center">{c.grade || "—"}</td>
                                                                <td className="px-3 py-1.5 text-center">{c.points.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {pendingReview.moduleType !== 'atelier' && (
                                            <div className="space-y-1 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                                                <p>
                                                    Note CC : <strong>{(pendingReview.continuousAssessment ?? 0).toFixed(2)}</strong>
                                                    <span className="text-muted-foreground"> (poids {pendingReview.continuousAssessmentWeight ?? 40} %)</span>
                                                </p>
                                                <p>
                                                    Note examen : <strong>{(pendingReview.exam ?? 0).toFixed(2)}</strong>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={() => setPendingReview(null)}>
                                        Modifier
                                    </Button>
                                    <Button onClick={confirmResult}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Enregistrer le résultat
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
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
                        moduleId={module.id}
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

                {/* ── Tab: Dashboard Analytics ── */}
                {activeTab === 'dashboard' && (
                    <AnalyticsDashboard
                        evaluationData={module.evaluationData}
                        allSavedEvaluations={allSavedEvaluations}
                        moduleName={module.name}
                    />
                )}

                {/* ── Tab: Alertes & Notes rapides ── */}
                {activeTab === 'alerts' && (
                    <div className="space-y-6">
                        {/* Étudiants à risque */}
                        <AtRiskStudents
                            studentNames={module.evaluationData.studentNames}
                            attendance={module.evaluationData.attendance}
                            totalPoints={module.evaluationData.totalPoints}
                            quickNotes={quickNotes}
                            atRiskConfig={atRiskConfig}
                        />

                        {/* Notes rapides */}
                        <QuickNotes
                            studentNames={module.evaluationData.studentNames}
                            quickNotes={quickNotes}
                            onAddNote={(note) => {
                                updateField('quickNotes', [...quickNotes, note]);
                            }}
                            onDeleteNote={(noteId) => {
                                updateField('quickNotes', quickNotes.filter((n) => n.id !== noteId));
                            }}
                        />

                        {/* Groupes de travail */}
                        <WorkGroups
                            studentNames={module.evaluationData.studentNames}
                            workGroups={workGroups}
                            onUpdate={(groups) => updateField('workGroups', groups)}
                        />
                    </div>
                )}

                {/* ── Tab: Tutorat ── */}
                {activeTab === 'tutoring' && (
                    <TutoringTracker
                        studentNames={module.evaluationData.studentNames}
                        sessions={tutoringSessions}
                        onUpdate={(sessions) => updateField('tutoringSessions', sessions)}
                    />
                )}

                {/* ── Tab: Rapports Pédagogiques ── */}
                {activeTab === 'reports' && (
                    <PedagogicalReports
                        evaluationData={module.evaluationData}
                        moduleName={module.name}
                        moduleType={module.type}
                    />
                )}
            </div>
        </div>
    );
}

    