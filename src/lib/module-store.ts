import { DEFAULT_CRITERIA } from '@/config/grading-config';
import type { EvaluationModule as EvaluationModuleType, ModuleType } from '@/types';
import { saveSafetySnapshot } from '@/lib/backup-service';

export const LOCALSTORAGE_MODULES_KEY = 'gradeAssist_modules';
export const LOCALSTORAGE_ACTIVE_MODULE_ID_KEY = 'gradeAssist_activeModuleId';
export const LOCALSTORAGE_VERSION_KEY = 'gradeAssist_version';

/** Noms de modules par défaut des anciennes versions, à remplacer à la migration. */
export const OLD_DEFAULT_MODULE_NAMES = [
  'Atelier Projet de Ville 1',
  'Projet de Ville 1',
  'Atelier Projet de Ville 2',
  'Projet de Ville 2',
  'Urbanisme',
  'Cours',
  'Cours et TD',
  'Atelier',
];

export interface StoredState {
  modules: EvaluationModuleType[];
  activeModuleId: string | null;
}

export const getNewEvaluationModule = (
  type: ModuleType,
  name: string
): EvaluationModuleType => ({
  id: `module_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: name,
  type: type,
  evaluationData: {
    id: `eval_${Date.now()}`,
    studentNames: [],
    teacherNames: [''],
    projectName: '',
    studyLevel: '',
    studySubLevel: '',
    session: '',
    academicYear: '',
    universityName: '',
    establishmentName: '',
    departmentName: '',
    masterSpecialty: '',
    universityLogo: null,
    selectedGrades: {},
    totalPoints: 0,
    evaluationSheetTitleComplement:
      '...............................................................',
    criteria: type === 'atelier' ? DEFAULT_CRITERIA : [],
    attendance: {},
    thesisStudents: [],
    adminEmail: '',
    syllabus: { chapters: [], pdfFileName: null, pdfDataUrl: null },
    quickNotes: [],
    workGroups: [],
    tutoringSessions: [],
    studentResults: [],
    atRiskConfig: { attendanceThreshold: 75, gradeThreshold: 10 },
    continuousAssessmentGrade:
      type === 'standard' || type === 'mooc' ? 10 : undefined,
    examGrade: type === 'standard' || type === 'mooc' ? 10 : undefined,
    continuousAssessmentWeight:
      type === 'standard' || type === 'mooc' ? 40 : undefined,
  },
});

/** Trois modules vierges, un par type d'évaluation. */
export function createDefaultModules(): EvaluationModuleType[] {
  return [
    getNewEvaluationModule('atelier', 'Nouvelle matière'),
    getNewEvaluationModule('standard', 'Nouvelle matière'),
    getNewEvaluationModule('mooc', 'Nouvelle matière'),
  ];
}

/**
 * Lit l'état persisté et applique la migration de version : les modules
 * portant un ancien nom par défaut sont remplacés. Une copie de sécurité est
 * enregistrée avant remplacement.
 *
 * Lève si le JSON stocké est illisible ; l'appelant décide alors de
 * réinitialiser l'état et de prévenir l'utilisateur.
 */
export function loadStoredState(appVersion: string): StoredState {
  const modulesData = localStorage.getItem(LOCALSTORAGE_MODULES_KEY);
  const activeIdData = localStorage.getItem(LOCALSTORAGE_ACTIVE_MODULE_ID_KEY);

  let loadedModules: EvaluationModuleType[] = [];
  if (modulesData) {
    loadedModules = JSON.parse(modulesData);
  }

  // Migration : vérifie la version et remplace les anciens modules par défaut.
  const storedVersion = localStorage.getItem(LOCALSTORAGE_VERSION_KEY);
  if (
    storedVersion !== appVersion &&
    Array.isArray(loadedModules) &&
    loadedModules.length > 0
  ) {
    // La migration remplace des modules : on conserve une copie de l'état
    // d'avant, restaurable depuis le bandeau de sauvegarde.
    const willMigrate = loadedModules.some((m) =>
      OLD_DEFAULT_MODULE_NAMES.includes(m.name)
    );
    if (willMigrate) {
      saveSafetySnapshot(loadedModules, 'avant migration de version', appVersion);
    }
    loadedModules = loadedModules.map((m) => {
      if (OLD_DEFAULT_MODULE_NAMES.includes(m.name)) {
        return getNewEvaluationModule('atelier', 'Nouvelle matière');
      }
      return m;
    });
    localStorage.setItem(LOCALSTORAGE_VERSION_KEY, appVersion);
  }

  if (!Array.isArray(loadedModules) || loadedModules.length === 0) {
    loadedModules = createDefaultModules();
    localStorage.setItem(LOCALSTORAGE_VERSION_KEY, appVersion);
  }

  let activeId: string | null = activeIdData ? JSON.parse(activeIdData) : null;
  if (!activeId || !loadedModules.some((m) => m.id === activeId)) {
    activeId = loadedModules[0]?.id || null;
  }

  return { modules: loadedModules, activeModuleId: activeId };
}

/**
 * Écrit l'état dans localStorage. Renvoie `false` si le quota est dépassé :
 * l'appelant doit alors l'annoncer, plutôt que d'afficher « sauvegardé ».
 */
export function persistState(
  modules: EvaluationModuleType[],
  activeModuleId: string | null
): boolean {
  try {
    localStorage.setItem(LOCALSTORAGE_MODULES_KEY, JSON.stringify(modules));
    localStorage.setItem(
      LOCALSTORAGE_ACTIVE_MODULE_ID_KEY,
      JSON.stringify(activeModuleId)
    );
    return true;
  } catch (error) {
    console.error('Échec de la sauvegarde locale :', error);
    return false;
  }
}
