/**
 * Service de synchronisation localStorage ↔ Neon Database
 * GradeAssist - Synchronisation cloud
 */

import type { EvaluationModule } from '@/types';

const LOCALSTORAGE_MODULES_KEY = 'gradeAssist_modules';
const LOCALSTORAGE_ACTIVE_MODULE_ID_KEY = 'gradeAssist_activeModuleId';

interface SyncResult {
  success: boolean;
  message: string;
  modulesSynced?: number;
  error?: string;
}

interface ConnectionStatus {
  connected: boolean;
  version?: string;
  error?: string;
}

// ══════════════════════════════════════════════════════════════
//  TEST DE CONNEXION
// ══════════════════════════════════════════════════════════════

export async function testConnection(): Promise<ConnectionStatus> {
  try {
    const res = await fetch('/api/db?action=test');
    const data = await res.json();
    return {
      connected: data.success,
      version: data.version,
      error: data.error,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion',
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  CHARGEMENT DEPUIS NEON
// ══════════════════════════════════════════════════════════════

export async function loadFromCloud(): Promise<SyncResult> {
  try {
    const res = await fetch('/api/db?action=modules');
    const data = await res.json();

    if (!data.success) {
      return {
        success: false,
        message: 'Échec du chargement depuis Neon',
        error: data.error,
      };
    }

    const cloudModules = data.data || [];

    if (cloudModules.length === 0) {
      return {
        success: true,
        message: 'Aucun module dans le cloud. La synchronisation push est recommandée.',
        modulesSynced: 0,
      };
    }

    // Charger les modules locaux
    const localModulesJson = localStorage.getItem(LOCALSTORAGE_MODULES_KEY);
    const localModules: EvaluationModule[] = localModulesJson ? JSON.parse(localModulesJson) : [];

    // Fusionner : les modules cloud écrasent les locaux (plus récent)
    const mergedModules = [...localModules];
    
    for (const cloudModule of cloudModules) {
      const localIndex = mergedModules.findIndex(m => m.id === cloudModule.id);
      
      // Récupérer les données d'évaluation complètes
      const evalRes = await fetch(`/api/db?action=evaluation&moduleId=${cloudModule.id}`);
      const evalData = await evalRes.json();
      
      const fullModule: EvaluationModule = {
        id: cloudModule.id,
        name: cloudModule.name,
        type: cloudModule.type,
        evaluationData: evalData.data || {
          id: cloudModule.id,
          studentNames: [],
          teacherNames: [],
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
          criteria: [],
          selectedGrades: {},
          totalPoints: 0,
          attendance: {},
          evaluationSheetTitleComplement: '',
          adminEmail: '',
          thesisStudents: [],
          syllabus: { chapters: [], pdfFileName: null, pdfDataUrl: null },
        },
      };

      if (localIndex >= 0) {
        mergedModules[localIndex] = fullModule;
      } else {
        mergedModules.push(fullModule);
      }
    }

    // Sauvegarder dans localStorage
    localStorage.setItem(LOCALSTORAGE_MODULES_KEY, JSON.stringify(mergedModules));

    return {
      success: true,
      message: `${cloudModules.length} module(s) chargé(s) depuis Neon`,
      modulesSynced: cloudModules.length,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur lors du chargement depuis Neon',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  SAUVEGARDE VERS NEON
// ══════════════════════════════════════════════════════════════

export async function saveToCloud(): Promise<SyncResult> {
  try {
    // Charger les modules locaux
    const localModulesJson = localStorage.getItem(LOCALSTORAGE_MODULES_KEY);
    const localModules: EvaluationModule[] = localModulesJson ? JSON.parse(localModulesJson) : [];

    if (localModules.length === 0) {
      return {
        success: true,
        message: 'Aucun module local à synchroniser',
        modulesSynced: 0,
      };
    }

    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncAll',
        modules: localModules,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      return {
        success: false,
        message: 'Échec de la sauvegarde vers Neon',
        error: data.error,
      };
    }

    return {
      success: true,
      message: `${localModules.length} module(s) sauvegardé(s) dans Neon`,
      modulesSynced: localModules.length,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur lors de la sauvegarde vers Neon',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  SYNCHRONISATION BIDIRECTIONNELLE
// ══════════════════════════════════════════════════════════════

export async function syncBidirectional(): Promise<SyncResult> {
  try {
    // 1. Sauvegarder le local vers Neon
    const pushResult = await saveToCloud();
    if (!pushResult.success) {
      return pushResult;
    }

    // 2. Recharger depuis Neon pour avoir les données à jour
    const pullResult = await loadFromCloud();

    return {
      success: true,
      message: `Synchronisation terminée : ${pushResult.modulesSynced} module(s) synchronisé(s)`,
      modulesSynced: pushResult.modulesSynced,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur lors de la synchronisation',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
