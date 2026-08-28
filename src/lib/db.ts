/**
 * Configuration de la base de données Neon (PostgreSQL serverless)
 * GradeAssist - Application d'évaluation universitaire
 */

import { neon } from '@neondatabase/serverless';

// Configuration de la connexion
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn(
    '⚠️  DATABASE_URL n\'est pas configuré. ' +
    'La synchronisation cloud est désactivée. ' +
    'Configurez-le dans Settings → Environment.'
  );
}

// Client SQL Neon (serverless, fonctionne sans TCP)
export const sql = neon(DATABASE_URL || '');

// Vérifier la connexion
export async function testConnection() {
  try {
    const result = await sql`SELECT version()`;
    return {
      success: true,
      version: result[0]?.version || 'unknown',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  SCHÉMA DE LA BASE DE DONNÉES
// ══════════════════════════════════════════════════════════════

export async function initializeDatabase() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL non configuré');
  }

  // Table des modules d'évaluation
  await sql`
    CREATE TABLE IF NOT EXISTS evaluation_modules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('atelier', 'standard')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Table des données d'évaluation
  await sql`
    CREATE TABLE IF NOT EXISTS evaluation_data (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL REFERENCES evaluation_modules(id) ON DELETE CASCADE,
      
      -- Informations générales
      student_names JSONB DEFAULT '[]',
      teacher_names JSONB DEFAULT '[]',
      project_name TEXT DEFAULT '',
      study_level TEXT DEFAULT '',
      study_sub_level TEXT DEFAULT '',
      session TEXT DEFAULT '',
      academic_year TEXT DEFAULT '',
      university_name TEXT DEFAULT '',
      establishment_name TEXT DEFAULT '',
      department_name TEXT DEFAULT '',
      master_specialty TEXT DEFAULT '',
      university_logo TEXT,
      admin_email TEXT DEFAULT '',
      evaluation_sheet_title_complement TEXT DEFAULT '',
      
      -- Critères d'évaluation
      criteria JSONB DEFAULT '[]',
      selected_grades JSONB DEFAULT '{}',
      total_points DECIMAL(5,2) DEFAULT 0,
      
      -- Note CC / Examen
      continuous_assessment_grade DECIMAL(4,2),
      exam_grade DECIMAL(4,2),
      continuous_assessment_weight INTEGER DEFAULT 40,
      
      -- Encadrement
      thesis_students JSONB DEFAULT '[]',
      
      -- Canevas
      syllabus JSONB DEFAULT '{"chapters":[],"pdfFileName":null,"pdfDataUrl":null}',
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Table des présences
  await sql`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      evaluation_id TEXT NOT NULL REFERENCES evaluation_data(id) ON DELETE CASCADE,
      student_name TEXT NOT NULL,
      attendance_date DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(evaluation_id, student_name, attendance_date)
    )
  `;

  // Table des événements d'encadrement
  await sql`
    CREATE TABLE IF NOT EXISTS supervision_events (
      id TEXT PRIMARY KEY,
      thesis_student_id TEXT NOT NULL,
      evaluation_id TEXT NOT NULL REFERENCES evaluation_data(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('consultation', 'chapter_deadline', 'meeting', 'review', 'reminder', 'other')),
      event_date DATE NOT NULL,
      event_time TIME NOT NULL,
      description TEXT DEFAULT '',
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Table des chapitres du canevas
  await sql`
    CREATE TABLE IF NOT EXISTS syllabus_chapters (
      id TEXT PRIMARY KEY,
      evaluation_id TEXT NOT NULL REFERENCES evaluation_data(id) ON DELETE CASCADE,
      parent_id TEXT,
      title TEXT NOT NULL,
      chapter_order INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
      planned_date DATE,
      planned_end_date DATE,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Index pour les performances
  await sql`CREATE INDEX IF NOT EXISTS idx_evaluation_module_id ON evaluation_data(module_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_evaluation_id ON attendance(evaluation_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_evaluation_id ON supervision_events(evaluation_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_chapters_evaluation_id ON syllabus_chapters(evaluation_id)`;

  console.log('✅ Base de données initialisée avec succès');
}

// ══════════════════════════════════════════════════════════════
//  FONCTIONS CRUD
// ══════════════════════════════════════════════════════════════

// Modules
export async function getModules() {
  const result = await sql`
    SELECT * FROM evaluation_modules ORDER BY created_at DESC
  `;
  return result;
}

export async function getModuleById(id: string) {
  const result = await sql`
    SELECT * FROM evaluation_modules WHERE id = ${id}
  `;
  return result[0] || null;
}

export async function createModule(id: string, name: string, type: string) {
  const result = await sql`
    INSERT INTO evaluation_modules (id, name, type)
    VALUES (${id}, ${name}, ${type})
    RETURNING *
  `;
  return result[0];
}

export async function deleteModule(id: string) {
  await sql`DELETE FROM evaluation_modules WHERE id = ${id}`;
}

// Évaluations
export async function getEvaluationByModuleId(moduleId: string) {
  const result = await sql`
    SELECT * FROM evaluation_data WHERE module_id = ${moduleId} LIMIT 1
  `;
  return result[0] || null;
}

export async function saveEvaluation(moduleId: string, data: Record<string, unknown>) {
  const result = await sql`
    INSERT INTO evaluation_data (id, module_id, student_names, teacher_names, project_name, 
      study_level, study_sub_level, session, academic_year, university_name, 
      establishment_name, department_name, master_specialty, university_logo, 
      admin_email, evaluation_sheet_title_complement, criteria, selected_grades, 
      total_points, continuous_assessment_grade, exam_grade, continuous_assessment_weight,
      thesis_students, syllabus)
    VALUES (
      ${data.id as string}, ${moduleId}, 
      ${JSON.stringify(data.studentNames)}::jsonb,
      ${JSON.stringify(data.teacherNames)}::jsonb,
      ${data.projectName as string || ''},
      ${data.studyLevel as string || ''},
      ${data.studySubLevel as string || ''},
      ${data.session as string || ''},
      ${data.academicYear as string || ''},
      ${data.universityName as string || ''},
      ${data.establishmentName as string || ''},
      ${data.departmentName as string || ''},
      ${data.masterSpecialty as string || ''},
      ${data.universityLogo as string || null},
      ${data.adminEmail as string || ''},
      ${data.evaluationSheetTitleComplement as string || ''},
      ${JSON.stringify(data.criteria)}::jsonb,
      ${JSON.stringify(data.selectedGrades)}::jsonb,
      ${data.totalPoints as number || 0},
      ${data.continuousAssessmentGrade as number || null},
      ${data.examGrade as number || null},
      ${data.continuousAssessmentWeight as number || 40},
      ${JSON.stringify(data.thesisStudents || [])}::jsonb,
      ${JSON.stringify(data.syllabus || { chapters: [], pdfFileName: null, pdfDataUrl: null })}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      student_names = EXCLUDED.student_names,
      teacher_names = EXCLUDED.teacher_names,
      project_name = EXCLUDED.project_name,
      study_level = EXCLUDED.study_level,
      study_sub_level = EXCLUDED.study_sub_level,
      session = EXCLUDED.session,
      academic_year = EXCLUDED.academic_year,
      university_name = EXCLUDED.university_name,
      establishment_name = EXCLUDED.establishment_name,
      department_name = EXCLUDED.department_name,
      master_specialty = EXCLUDED.master_specialty,
      university_logo = EXCLUDED.university_logo,
      admin_email = EXCLUDED.admin_email,
      evaluation_sheet_title_complement = EXCLUDED.evaluation_sheet_title_complement,
      criteria = EXCLUDED.criteria,
      selected_grades = EXCLUDED.selected_grades,
      total_points = EXCLUDED.total_points,
      continuous_assessment_grade = EXCLUDED.continuous_assessment_grade,
      exam_grade = EXCLUDED.exam_grade,
      continuous_assessment_weight = EXCLUDED.continuous_assessment_weight,
      thesis_students = EXCLUDED.thesis_students,
      syllabus = EXCLUDED.syllabus,
      updated_at = NOW()
    RETURNING *
  `;
  return result[0];
}

// Présences
export async function saveAttendance(evaluationId: string, studentName: string, date: string, status: string) {
  const result = await sql`
    INSERT INTO attendance (evaluation_id, student_name, attendance_date, status)
    VALUES (${evaluationId}, ${studentName}, ${date}::date, ${status})
    ON CONFLICT (evaluation_id, student_name, attendance_date) 
    DO UPDATE SET status = EXCLUDED.status
    RETURNING *
  `;
  return result[0];
}

export async function getAttendance(evaluationId: string) {
  const result = await sql`
    SELECT * FROM attendance WHERE evaluation_id = ${evaluationId} ORDER BY attendance_date
  `;
  return result;
}
