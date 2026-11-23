import type { EvaluationData, EvaluationModule, ModuleType } from "@/types";

/**
 * Sauvegarde et restauration locales de l'ensemble des modules.
 *
 * Les données de GradeAssist vivent dans le `localStorage` du navigateur
 * (plafond de 5 à 10 Mo). Ce service produit un fichier JSON unique, lisible
 * et vérifiable, que l'enseignant conserve où il le souhaite.
 *
 * La restauration est volontairement tolérante : les champs absents reçoivent
 * une valeur par défaut, afin qu'une sauvegarde ancienne ne fasse pas planter
 * l'application au chargement.
 */

export const BACKUP_APP_ID = "gradeassist";
export const BACKUP_FORMAT_VERSION = 1;

/** Taille maximale acceptée à l'import (25 Mo). */
const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

const MODULE_TYPES: ModuleType[] = ["atelier", "standard", "mooc"];

export interface BackupFile {
  app: string;
  formatVersion: number;
  appVersion: string;
  exportedAt: string;
  moduleCount: number;
  modules: EvaluationModule[];
}

export interface ParsedBackup {
  modules: EvaluationModule[];
  exportedAt: string;
  appVersion: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  const names = value.filter((item): item is string => typeof item === "string");
  return names.length > 0 ? names : fallback;
}

/** Construit l'objet de sauvegarde à partir des modules en mémoire. */
export function buildBackup(
  modules: EvaluationModule[],
  appVersion: string
): BackupFile {
  return {
    app: BACKUP_APP_ID,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion,
    exportedAt: new Date().toISOString(),
    moduleCount: modules.length,
    modules,
  };
}

/** Nom de fichier proposé au téléchargement. */
export function backupFileName(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  const time = date.toTimeString().slice(0, 5).replace(":", "h");
  return `gradeassist-sauvegarde-${stamp}-${time}.json`;
}

/** Sérialise la sauvegarde. */
export function serializeBackup(
  modules: EvaluationModule[],
  appVersion: string
): { json: string; bytes: number } {
  const json = JSON.stringify(buildBackup(modules, appVersion), null, 2);
  return { json, bytes: new Blob([json]).size };
}

/**
 * Déclenche le téléchargement du fichier de sauvegarde.
 * Retourne la taille produite, en octets.
 */
export function downloadBackup(
  modules: EvaluationModule[],
  appVersion: string
): number {
  const { json, bytes } = serializeBackup(modules, appVersion);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = backupFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Laisse au navigateur le temps de démarrer le téléchargement.
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
  return bytes;
}

/** Complète un module importé avec les valeurs par défaut attendues. */
function normalizeModule(raw: unknown, index: number): EvaluationModule {
  if (!isRecord(raw)) {
    throw new Error(`Module ${index + 1} : structure invalide.`);
  }

  const data = isRecord(raw.evaluationData) ? raw.evaluationData : {};
  const typed = data as unknown as Partial<EvaluationData>;

  const type = MODULE_TYPES.includes(raw.type as ModuleType)
    ? (raw.type as ModuleType)
    : "atelier";

  const syllabus = typed.syllabus ?? { chapters: [], pdfFileName: null, pdfDataUrl: null };

  return {
    id:
      typeof raw.id === "string" && raw.id.length > 0
        ? raw.id
        : `module_import_${Date.now()}_${index}`,
    name:
      typeof raw.name === "string" && raw.name.trim().length > 0
        ? raw.name
        : `Module restauré ${index + 1}`,
    type,
    evaluationData: {
      id:
        typeof typed.id === "string" && typed.id.length > 0
          ? typed.id
          : `eval_import_${Date.now()}_${index}`,
      studentNames: asStringArray(typed.studentNames),
      projectName: typed.projectName ?? "",
      studyLevel: typed.studyLevel ?? "",
      studySubLevel: typed.studySubLevel ?? "",
      session: typed.session ?? "",
      academicYear: typed.academicYear ?? "",
      universityName: typed.universityName ?? "",
      establishmentName: typed.establishmentName ?? "",
      departmentName: typed.departmentName ?? "",
      masterSpecialty: typed.masterSpecialty ?? "",
      universityLogo:
        typeof typed.universityLogo === "string" ? typed.universityLogo : null,
      teacherNames: asStringArray(typed.teacherNames, [""]),
      criteria: Array.isArray(typed.criteria) ? typed.criteria : [],
      selectedGrades: typed.selectedGrades ?? {},
      totalPoints:
        typeof typed.totalPoints === "number" ? typed.totalPoints : 0,
      attendance: typed.attendance ?? {},
      continuousAssessmentGrade: typed.continuousAssessmentGrade,
      examGrade: typed.examGrade,
      continuousAssessmentWeight: typed.continuousAssessmentWeight,
      evaluationSheetTitleComplement:
        typed.evaluationSheetTitleComplement ?? "",
      adminEmail: typed.adminEmail ?? "",
      thesisStudents: Array.isArray(typed.thesisStudents)
        ? typed.thesisStudents
        : [],
      syllabus: {
        chapters: Array.isArray(syllabus.chapters) ? syllabus.chapters : [],
        pdfFileName: syllabus.pdfFileName ?? null,
        pdfDataUrl: syllabus.pdfDataUrl ?? null,
      },
      quickNotes: Array.isArray(typed.quickNotes) ? typed.quickNotes : [],
      workGroups: Array.isArray(typed.workGroups) ? typed.workGroups : [],
      atRiskConfig: typed.atRiskConfig ?? {
        attendanceThreshold: 75,
        gradeThreshold: 10,
      },
      tutoringSessions: Array.isArray(typed.tutoringSessions)
        ? typed.tutoringSessions
        : [],
      // Sauvegardes antérieures à l'ajout des résultats : on repart d'un tableau
      // vide plutôt que de laisser le champ indéfini.
      studentResults: Array.isArray(typed.studentResults)
        ? typed.studentResults
        : [],
    },
  };
}

/**
 * Lit et valide un fichier de sauvegarde.
 * Lève une `Error` avec un message affichable à l'utilisateur.
 */
export function parseBackup(raw: string): ParsedBackup {
  if (raw.length > MAX_BACKUP_BYTES) {
    throw new Error("Fichier trop volumineux (25 Mo maximum).");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Fichier illisible : ce n'est pas un fichier JSON valide.");
  }

  // Rétrocompatibilité : un ancien export peut n'être qu'un tableau de modules.
  const payload: Record<string, unknown> = Array.isArray(parsed)
    ? { modules: parsed }
    : isRecord(parsed)
      ? parsed
      : {};

  if (payload.app !== undefined && payload.app !== BACKUP_APP_ID) {
    throw new Error("Ce fichier ne provient pas de GradeAssist.");
  }

  const rawModules = payload.modules;
  if (!Array.isArray(rawModules) || rawModules.length === 0) {
    throw new Error("La sauvegarde ne contient aucun module.");
  }

  return {
    modules: rawModules.map((module, index) => normalizeModule(module, index)),
    exportedAt:
      typeof payload.exportedAt === "string" ? payload.exportedAt : "",
    appVersion:
      typeof payload.appVersion === "string" ? payload.appVersion : "inconnue",
  };
}

/** Taille approximative des données sérialisées, en octets. */
export function estimateStorageBytes(modules: EvaluationModule[]): number {
  try {
    return new Blob([JSON.stringify(modules)]).size;
  } catch {
    return 0;
  }
}

/** Formatage lisible d'une taille. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
