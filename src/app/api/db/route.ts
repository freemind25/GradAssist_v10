/**
 * API Route pour les opérations de base de données Neon
 * GradeAssist - Synchronisation cloud
 */

import { NextRequest, NextResponse } from 'next/server';
import { testConnection, initializeDatabase, getModules, getEvaluationByModuleId, saveEvaluation } from '@/lib/db';

// GET - Tester la connexion et récupérer les données
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'test': {
        const result = await testConnection();
        return NextResponse.json(result);
      }

      case 'modules': {
        const modules = await getModules();
        return NextResponse.json({ success: true, data: modules });
      }

      case 'evaluation': {
        const moduleId = searchParams.get('moduleId');
        if (!moduleId) {
          return NextResponse.json({ error: 'moduleId requis' }, { status: 400 });
        }
        const evaluation = await getEvaluationByModuleId(moduleId);
        return NextResponse.json({ success: true, data: evaluation });
      }

      case 'init': {
        await initializeDatabase();
        return NextResponse.json({ success: true, message: 'Base de données initialisée' });
      }

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur API DB:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

// POST - Sauvegarder les données
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case 'saveEvaluation': {
        if (!data.moduleId || !data.evaluationData) {
          return NextResponse.json({ error: 'moduleId et evaluationData requis' }, { status: 400 });
        }
        const result = await saveEvaluation(data.moduleId, data.evaluationData);
        return NextResponse.json({ success: true, data: result });
      }

      case 'syncAll': {
        // Synchroniser toutes les données locales vers Neon
        const { modules } = body;
        if (!Array.isArray(modules)) {
          return NextResponse.json({ error: 'modules requis (array)' }, { status: 400 });
        }
        
        // Sauvegarder chaque module et son évaluation
        for (const module of modules) {
          await saveEvaluation(module.id, {
            ...module.evaluationData,
            id: module.evaluationData.id || module.id,
          });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `${modules.length} module(s) synchronisé(s)` 
        });
      }

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur API DB POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
