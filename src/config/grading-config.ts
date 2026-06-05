
import type { Criterion, GradeLevel } from '@/types';

// Default criteria when the application starts or is reset
export const DEFAULT_CRITERIA: Criterion[] = [
  { id: 'oral', name: 'Présentation orale', details: '(Contenu, Clarté, Dynamisme)', coefficient: 4 },
  { id: 'poster', name: 'Présentation Affichée', details: '(Contenu, Clarté, Attractivité)', coefficient: 4 },
  { id: 'synthesis', name: 'Esprit de synthèse', coefficient: 3 },
  { id: 'innovation', name: 'Innovation', coefficient: 3 },
  { id: 'peerEval', name: 'Évaluation par les pairs', coefficient: 2 },
  { id: 'objectives', name: 'Atteinte des objectifs et respect du contenu', coefficient: 2 },
  { id: 'fieldTrips', name: 'Sorties sur terrains', coefficient: 1 },
  { id: 'attendance', name: 'Assiduité (Présence /Absence)', coefficient: 1 },
];

export const TARGET_SUM_COEFFICIENTS = 20;

export const gradeLevels: GradeLevel[] = [
  { name: 'A+', pointsFactor: 1.0, percentageDisplay: '90-100%' },
  { name: 'A',  pointsFactor: 0.89, percentageDisplay: '85-89%' },
  { name: 'A-', pointsFactor: 0.84, percentageDisplay: '80-84%' },
  { name: 'B+', pointsFactor: 0.79, percentageDisplay: '75-79%' },
  { name: 'B',  pointsFactor: 0.74, percentageDisplay: '70-74%' },
  { name: 'C+', pointsFactor: 0.69, percentageDisplay: '65-69%' },
  { name: 'C',  pointsFactor: 0.64, percentageDisplay: '60-64%' },
  { name: 'D+', pointsFactor: 0.59, percentageDisplay: '55-59%' },
  { name: 'D',  pointsFactor: 0.54, percentageDisplay: '50-54%' },
  { name: 'E',  pointsFactor: 0.49, percentageDisplay: '40-49%*' },
  { name: 'F',  pointsFactor: 0.39, percentageDisplay: '0-39%' },
];

// Threshold for styling: D (50-54%) and above is considered passing.
export const PASSING_GRADE_POINTS_FACTOR_THRESHOLD = 0.54;
