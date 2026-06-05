"use client";

import type * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useMemo } from 'react';

interface StandardModuleFormProps {
  continuousAssessmentGrade: number;
  setContinuousAssessmentGrade: (value: number) => void;
  examGrade: number;
  setExamGrade: (value: number) => void;
  continuousAssessmentWeight: number;
  setContinuousAssessmentWeight: (value: number) => void;
}

export function StandardModuleForm({
  continuousAssessmentGrade,
  setContinuousAssessmentGrade,
  examGrade,
  setExamGrade,
  continuousAssessmentWeight,
  setContinuousAssessmentWeight,
}: StandardModuleFormProps) {

  const examWeight = 100 - continuousAssessmentWeight;

  const finalGrade = useMemo(() => {
    const cc = continuousAssessmentGrade ?? 0;
    const exam = examGrade ?? 0;
    const ccWeight = continuousAssessmentWeight / 100;
    const examWeight = (100 - continuousAssessmentWeight) / 100;
    
    if (cc < 0 || cc > 20 || exam < 0 || exam > 20) return 0;
    
    return (cc * ccWeight) + (exam * examWeight);
  }, [continuousAssessmentGrade, examGrade, continuousAssessmentWeight]);
  
  const handleWeightChange = (value: number[]) => {
    setContinuousAssessmentWeight(value[0]);
  };
  
  const handleInputChange = (setter: (value: number) => void, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 20) {
        setter(num);
    } else if (value === "") {
        setter(0);
    }
  };

  return (
    <Card className="shadow-lg border-t-4 border-primary">
      <CardHeader>
        <CardTitle className="text-xl">Évaluation de la Matière</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Continuous Assessment */}
            <div className="space-y-2">
                <Label htmlFor="continuousAssessmentGrade">Note du Contrôle Continu (/20)</Label>
                <Input
                    id="continuousAssessmentGrade"
                    type="number"
                    value={continuousAssessmentGrade}
                    onChange={(e) => handleInputChange(setContinuousAssessmentGrade, e.target.value)}
                    placeholder="ex: 14.5"
                    min="0"
                    max="20"
                    step="0.5"
                />
            </div>
            
            {/* Exam */}
            <div className="space-y-2">
                <Label htmlFor="examGrade">Note de l'Examen (/20)</Label>
                <Input
                    id="examGrade"
                    type="number"
                    value={examGrade}
                    onChange={(e) => handleInputChange(setExamGrade, e.target.value)}
                    placeholder="ex: 12"
                    min="0"
                    max="20"
                    step="0.5"
                />
            </div>
        </div>

        <div className="space-y-4">
            <Label>Pondération des Notes</Label>
            <div className="relative pt-8">
                 <Slider
                    value={[continuousAssessmentWeight]}
                    onValueChange={handleWeightChange}
                    min={30}
                    max={70}
                    step={5}
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>30%</span>
                    <span>50%</span>
                    <span>70%</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="font-semibold">Contrôle Continu</p>
                        <p className="text-lg text-primary font-bold">{continuousAssessmentWeight}%</p>
                    </div>
                    <div>
                        <p className="font-semibold">Examen</p>
                        <p className="text-lg text-primary font-bold">{examWeight}%</p>
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
       <CardFooter>
          <div className="w-full text-center">
             <p className="text-xl font-semibold text-foreground">
              Note Finale: <span className="text-primary-foreground bg-primary px-3 py-1.5 rounded-md text-2xl">{finalGrade.toFixed(2)}</span> / 20.00
            </p>
          </div>
      </CardFooter>
    </Card>
  );
}
