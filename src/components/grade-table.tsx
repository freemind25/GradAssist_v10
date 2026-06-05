
"use client";

import type * as React from 'react';
import { useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Criterion, GradeLevel, SelectedGrades } from "@/types";
import { PASSING_GRADE_POINTS_FACTOR_THRESHOLD, TARGET_SUM_COEFFICIENTS } from "@/config/grading-config";

interface GradeTableProps {
  criteria: Criterion[];
  gradeLevels: GradeLevel[];
  selectedGrades: SelectedGrades;
  onGradeSelect: (criterionId: string, gradeValue: string) => void;
  onUpdateCriterion: (id: string, field: keyof Criterion, value: string | number) => void;
  onRemoveCriterion: (id: string) => void;
  // currentCoefficientSum: number; // Now calculated internally or passed to parent for display
  // onAddCriterion: () => void; // This will be handled in page.tsx now
}

const NON_NOTE_VALUE = "__NONE__";

interface NumericGradeOption {
  value: string; 
  label: string; 
}

interface NumericGradeGroup {
  label: string; 
  options: NumericGradeOption[];
}

function generateGroupedNumericGradeOptions(
  criterion: Criterion,
  allGradeLevels: GradeLevel[]
): NumericGradeGroup[] {
  const groupedOptions: NumericGradeGroup[] = [];

  if (criterion.coefficient === 0) { // No grade options if coefficient is 0
    return [{ label: "Coefficient à 0 - Non notable", options: [] }];
  }

  for (const gradeLevel of allGradeLevels) { 
    const { percentageDisplay, name: gradeName } = gradeLevel;
    const match = percentageDisplay.match(/(\d+)-(\d+)/);
    if (!match) continue;

    const minPercent = parseInt(match[1], 10);
    const maxPercent = parseInt(match[2], 10);

    const bandMinScore = criterion.coefficient * (minPercent / 100);
    const bandMaxScore = criterion.coefficient * (maxPercent / 100);

    const currentGroupOptions: NumericGradeOption[] = [];
    
    const groupMinRounded = parseFloat(bandMinScore.toFixed(1));
    const groupMaxRounded = parseFloat(bandMaxScore.toFixed(1));
    
    let currentScoreNum = groupMinRounded; 
    while(currentScoreNum <= groupMaxRounded + 0.01) { 
        const valStr = currentScoreNum.toFixed(1);
        currentGroupOptions.push({ value: valStr, label: valStr });
        currentScoreNum = parseFloat((currentScoreNum + 0.1).toFixed(1));
    }

    if (currentGroupOptions.length > 0) {
      groupedOptions.push({
        label: `${gradeName} (${percentageDisplay})`,
        options: currentGroupOptions,
      });
    }
  }
  return groupedOptions;
}


export function GradeTable({
  criteria,
  gradeLevels,
  selectedGrades,
  onGradeSelect,
  onUpdateCriterion,
  onRemoveCriterion,
}: GradeTableProps) {

  const getPointsForCriterion = (numericGradeStr: string | undefined): number => {
    if (!numericGradeStr || numericGradeStr === NON_NOTE_VALUE) return 0;
    const points = parseFloat(numericGradeStr);
    return isNaN(points) ? 0 : points;
  };

  const getSelectTriggerClassName = (numericGradeStr: string | undefined, criterion: Criterion): string => {
    if (!numericGradeStr || numericGradeStr === NON_NOTE_VALUE) return "bg-muted hover:bg-muted/80";

    const selectedPoints = parseFloat(numericGradeStr);
    if (isNaN(selectedPoints)) return "bg-muted hover:bg-muted/80";
    
    if (criterion.coefficient === 0) { // If coefficient is 0
        return selectedPoints > 0 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90";
    }


    if (selectedPoints === 0) {
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
    }

    const pointsFactorEquivalent = selectedPoints / criterion.coefficient;

    if (pointsFactorEquivalent >= PASSING_GRADE_POINTS_FACTOR_THRESHOLD) {
      return "bg-accent text-accent-foreground hover:bg-accent/90";
    }
    
    return "bg-primary text-primary-foreground hover:bg-primary/90";
  };
  
  const memoizedGradeOptions = useMemo(() => {
    const allOptions: Record<string, NumericGradeGroup[]> = {};
    criteria.forEach(criterion => {
      allOptions[criterion.id] = generateGroupedNumericGradeOptions(criterion, gradeLevels);
    });
    return allOptions;
  }, [criteria, gradeLevels]);

  const currentLocalCoefficientSum = useMemo(() => {
    return criteria.reduce((sum, criterion) => sum + criterion.coefficient, 0);
  }, [criteria]);


  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px] sticky left-0 bg-card z-10">Critère d'Évaluation</TableHead>
            <TableHead className="min-w-[150px]">Détails (Optionnel)</TableHead>
            <TableHead className="w-[100px] text-center">Coeff.</TableHead>
            <TableHead className="w-[200px] text-center">Note Attribuée</TableHead>
            <TableHead className="w-[100px] text-center">Points Obtenus</TableHead>
            <TableHead className="w-[80px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {criteria.map((criterion) => {
            const criterionOptions = memoizedGradeOptions[criterion.id] || [];
            const isCoefficientZero = criterion.coefficient === 0;
            return (
              <TableRow key={criterion.id}>
                <TableCell className="font-medium sticky left-0 bg-card z-10 py-1">
                  <Input
                    value={criterion.name}
                    onChange={(e) => onUpdateCriterion(criterion.id, 'name', e.target.value)}
                    className="h-9 text-sm"
                    placeholder="Nom du critère"
                  />
                </TableCell>
                <TableCell className="py-1">
                  <Input
                    value={criterion.details || ""}
                    onChange={(e) => onUpdateCriterion(criterion.id, 'details', e.target.value)}
                    className="h-9 text-sm"
                    placeholder="Détails"
                  />
                </TableCell>
                <TableCell className="text-center py-1">
                  <Input
                    type="number"
                    value={criterion.coefficient}
                    onChange={(e) => onUpdateCriterion(criterion.id, 'coefficient', parseFloat(e.target.value) || 0)}
                    className="h-9 w-20 text-center text-sm"
                    min="0"
                    step="0.5"
                  />
                </TableCell>
                <TableCell className="text-center p-1">
                  <Select
                    value={isCoefficientZero ? NON_NOTE_VALUE : (selectedGrades[criterion.id] || "")} 
                    onValueChange={(value) => onGradeSelect(criterion.id, value)}
                    disabled={isCoefficientZero}
                  >
                    <SelectTrigger 
                      className={cn(
                        "w-full h-9 min-w-[120px] text-sm",
                         isCoefficientZero ? "bg-muted hover:bg-muted/80" : getSelectTriggerClassName(selectedGrades[criterion.id], criterion)
                      )}
                      aria-label={`Select grade for ${criterion.name}`}
                    >
                      <SelectValue placeholder={isCoefficientZero ? "N/A (Coeff. 0)" : "Choisir..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {!isCoefficientZero && <SelectItem value={NON_NOTE_VALUE}>-- Non Noté --</SelectItem>}
                      {criterionOptions.map(group => (
                        <SelectGroup key={group.label}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.options.map(option => (
                            <SelectItem key={`${criterion.id}-${group.label}-${option.value}`} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                       {isCoefficientZero && <SelectItem value={NON_NOTE_VALUE} disabled>N/A (Coeff. 0)</SelectItem>}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {isCoefficientZero ? "0.00" : getPointsForCriterion(selectedGrades[criterion.id]).toFixed(2)}
                </TableCell>
                <TableCell className="text-center py-1">
                  <Button variant="ghost" size="icon" onClick={() => onRemoveCriterion(criterion.id)} aria-label="Supprimer critère">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
            <TableRow>
                <TableCell colSpan={2} className="text-right font-medium">Total Coefficients Actuel:</TableCell>
                <TableCell className="text-center font-bold text-lg">
                    {currentLocalCoefficientSum.toFixed(2)}
                </TableCell>
                <TableCell colSpan={3} className={`text-left font-medium text-sm ${currentLocalCoefficientSum !== TARGET_SUM_COEFFICIENTS ? 'text-destructive' : ''}`}>
                    (Objectif: {TARGET_SUM_COEFFICIENTS.toFixed(2)})
                </TableCell>
            </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
