

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
}

export type ModuleType = 'atelier' | 'standard';

export interface EvaluationModule {
  id: string;
  name: string;
  type: ModuleType;
  evaluationData: EvaluationData;
}
