import { z } from "zod";
import { DEFAULT_CRITERIA } from "@/config/grading-config";
import type { EvaluationModule, ModuleType } from "@/types";
import { calculateAtelierTotalPoints } from "@/lib/grading";

export const LOCALSTORAGE_MODULES_KEY = "gradeAssist_modules";
export const LOCALSTORAGE_ACTIVE_MODULE_ID_KEY = "gradeAssist_activeModuleId";

const attendanceStatusSchema = z.enum(["present", "absent", "late", "excused"]);

const criterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  details: z.string().optional(),
  coefficient: z.number(),
});

const evaluationDataSchema = z.object({
  id: z.string(),
  studentNames: z.array(z.string()).default([""]),
  projectName: z.string().default(""),
  studyLevel: z.string().default(""),
  studySubLevel: z.string().default(""),
  session: z.string().default(""),
  academicYear: z.string().default(""),
  universityName: z.string().default(""),
  establishmentName: z.string().default(""),
  departmentName: z.string().default(""),
  masterSpecialty: z.string().default(""),
  universityLogo: z.string().nullable().default(null),
  teacherNames: z.array(z.string()).default([""]),
  criteria: z.array(criterionSchema).default(DEFAULT_CRITERIA),
  selectedGrades: z.record(z.string()).default({}),
  totalPoints: z.number().default(0),
  attendance: z.record(z.record(attendanceStatusSchema)).default({}),
  continuousAssessmentGrade: z.number().optional(),
  examGrade: z.number().optional(),
  continuousAssessmentWeight: z.number().optional(),
  evaluationSheetTitleComplement: z.string().default("..............................................................."),
});

const moduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["atelier", "standard"]),
  evaluationData: evaluationDataSchema,
  summaryEvaluations: z.array(evaluationDataSchema).optional().default([]),
});

const modulesSchema = z.array(moduleSchema);

export const createEvaluationModule = (type: ModuleType, name: string): EvaluationModule => {
  const now = Date.now();

  return {
    id: `module_${now}`,
    name,
    type,
    summaryEvaluations: [],
    evaluationData: {
      id: `eval_${now}`,
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
      continuousAssessmentGrade: type === "standard" ? 10 : undefined,
      examGrade: type === "standard" ? 10 : undefined,
      continuousAssessmentWeight: type === "standard" ? 40 : undefined,
    },
  };
};

export const normalizeModule = (module: EvaluationModule): EvaluationModule => {
  if (module.type !== "atelier") return module;

  return {
    ...module,
    evaluationData: {
      ...module.evaluationData,
      totalPoints: calculateAtelierTotalPoints(
        module.evaluationData.criteria,
        module.evaluationData.selectedGrades,
      ),
    },
    summaryEvaluations: module.summaryEvaluations ?? [],
  };
};

export const loadPersistedModules = (): EvaluationModule[] => {
  const modulesData = localStorage.getItem(LOCALSTORAGE_MODULES_KEY);
  if (!modulesData) return [];

  return modulesSchema.parse(JSON.parse(modulesData)).map(normalizeModule);
};

export const loadPersistedActiveModuleId = (): string | null => {
  const activeIdData = localStorage.getItem(LOCALSTORAGE_ACTIVE_MODULE_ID_KEY);
  if (!activeIdData) return null;

  return z.string().nullable().parse(JSON.parse(activeIdData));
};

export const savePersistedState = (modules: EvaluationModule[], activeModuleId: string | null): void => {
  localStorage.setItem(LOCALSTORAGE_MODULES_KEY, JSON.stringify(modules));
  localStorage.setItem(LOCALSTORAGE_ACTIVE_MODULE_ID_KEY, JSON.stringify(activeModuleId));
};
