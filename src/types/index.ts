

export interface GradeLevel {
  name: string; // e.g., "A+"
  pointsFactor: number; // e.g., 1.0 for A+, 0.89 for A. This is multiplied by criterion.coefficient
  percentageDisplay: string; // e.g., "90-100%"
}

export interface Criterion {
  id: string; // Should be unique, e.g., 'oral', 'custom_123'
  name: string;
  details?: string; // Optional: e.g., "(Contenu, Clarté, Dynamisme)"
  coefficient: number; // e.g., 4
}

export interface SelectedGrades {
  [criterionId: string]: string | undefined; // Stores the selected NUMERIC grade string (e.g., "3.5") or undefined if not graded
}

export type EventType = 'consultation' | 'chapter_deadline' | 'meeting' | 'review' | 'reminder' | 'other';

export interface SupervisionEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;       // ISO date string YYYY-MM-DD
  time: string;       // HH:MM
  description: string;
  completed: boolean;
}

export interface ThesisStudent {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  advisor: string;
  coAdvisor: string;
  progress: number; // 0-100
  status: 'en cours' | 'en rédaction' | 'soutenu' | 'abandonné';
  startDate: string;
  defenseDate: string;
  description: string;
  keywords: string;
  events: SupervisionEvent[];
  email: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  [studentName: string]: AttendanceStatus; // Key is the student's name
}

export interface AttendanceData {
  [date: string]: AttendanceRecord; // e.g., { '2024-05-21': { 'John Doe': 'present' } }
}

// Represents the data for a single, complete evaluation form.
export interface EvaluationData {
  id: string; // Unique ID for this evaluation instance
  studentNames: string[];
  projectName: string;
  studyLevel: string;
  studySubLevel: string;
  session: string;
  academicYear: string;
  universityName: string;
  establishmentName: string;
  departmentName: string;
  masterSpecialty: string;
  universityLogo: string | null;
  teacherNames: string[];
  
  // Atelier-specific fields
  criteria: Criterion[];
  selectedGrades: SelectedGrades;
  totalPoints: number;
  attendance: AttendanceData;

  // Standard module fields
  continuousAssessmentGrade?: number;
  examGrade?: number;
  continuousAssessmentWeight?: number; // Percentage (e.g., 40 for 40%)

  // Common fields
  evaluationSheetTitleComplement: string;
  adminEmail: string;

  // Encadrement (thesis supervision)
  thesisStudents: ThesisStudent[];

  // Canevas de cours
  syllabus: CourseSyllabus;

  // Notes rapides
  quickNotes: QuickNote[];

  // Groupes de travail
  workGroups: WorkGroup[];

  // Configuration alertes
  atRiskConfig: AtRiskConfig;

  // Tutorat
  tutoringSessions: TutoringSession[];
}

export type ChapterStatus = 'not_started' | 'in_progress' | 'completed';

export interface SyllabusChapter {
  id: string;
  title: string;
  order: number;
  status: ChapterStatus;
  plannedDate: string;    // YYYY-MM-DD
  plannedEndDate: string; // YYYY-MM-DD
  notes: string;
  subchapters: SyllabusChapter[];
}

export interface CourseSyllabus {
  chapters: SyllabusChapter[];
  pdfFileName: string | null;
  pdfDataUrl: string | null; // stored as base64 data URL
}

export type ModuleType = 'atelier' | 'standard';

export interface EvaluationModule {
  id: string;
  name: string;
  type: ModuleType;
  evaluationData: EvaluationData;
}

// ─── Notes rapides (Quick Notes) ───
export type QuickNoteType = 'positive' | 'negative' | 'neutral';

export interface QuickNote {
  id: string;
  studentName: string;
  text: string;
  type: QuickNoteType;
  timestamp: string; // ISO date string
}

// ─── Groupes de travail ───
export interface WorkGroup {
  id: string;
  name: string;
  color: string; // hex color for visual distinction
  studentNames: string[];
}

// ─── Étudiants à risque ───
export interface AtRiskConfig {
  attendanceThreshold: number; // percentage, default 75
  gradeThreshold: number; // out of 20, default 10
}

// ─── Tutorat (Tutoring) ───
export type TutoringSessionType = 'cours' | 'td' | 'tp' | 'rattrapage' | 'prep_examen' | 'methode' | 'autre';

export interface TutoringSession {
  id: string;
  studentName: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  duration: number;    // minutes
  sessionType: TutoringSessionType;
  topic: string;       // Chapitre/sujet abordé
  objectives: string;  // Objectifs de la séance
  materials: string;   // Support utilisé (diapo, exercices, etc.)
  notes: string;       // Notes libres
  progress: number;    // 0-100, progression de l'étudiant
  rating: number;      // 1-5, qualité de la séance
  completed: boolean;
}

export interface TutoringStats {
  totalSessions: number;
  totalHours: number;
  byType: Record<TutoringSessionType, number>;
  byStudent: Record<string, number>;
  avgRating: number;
  avgDuration: number;
  completionRate: number;
}
