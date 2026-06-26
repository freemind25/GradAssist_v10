import type { Criterion, SelectedGrades } from "@/types";

export const NON_NOTE_VALUE = "__NONE__";

export const getPointsForSelectedGrade = (selectedGradeStr: string | undefined): number => {
  if (!selectedGradeStr || selectedGradeStr === NON_NOTE_VALUE) return 0;
  const points = parseFloat(selectedGradeStr);
  return Number.isNaN(points) ? 0 : points;
};

export const calculateAtelierTotalPoints = (
  criteria: Criterion[],
  selectedGrades: SelectedGrades,
): number => {
  return criteria.reduce((sum, criterion) => {
    return sum + getPointsForSelectedGrade(selectedGrades[criterion.id]);
  }, 0);
};

export const calculateStandardFinalGrade = (
  continuousAssessmentGrade: number,
  examGrade: number,
  continuousAssessmentWeight: number,
): number => {
  const cc = continuousAssessmentGrade ?? 0;
  const exam = examGrade ?? 0;

  if (cc < 0 || cc > 20 || exam < 0 || exam > 20) return 0;

  const ccWeight = continuousAssessmentWeight / 100;
  const examWeight = (100 - continuousAssessmentWeight) / 100;

  return (cc * ccWeight) + (exam * examWeight);
};
