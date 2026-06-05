
"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import type { Criterion, SelectedGrades } from "@/types";
import { exportIndividualCSV, exportIndividualPDF } from "@/lib/export-service";

interface ExportButtonsProps {
  criteria: Criterion[];
  selectedGrades: SelectedGrades;
  studentNames: string[];
  teacherNames: string[];
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
  totalPoints: number;
  maxTotalPoints: number;
  evaluationSheetTitleComplement: string;
}

export function ExportButtons(props: ExportButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button onClick={() => exportIndividualCSV(props)} variant="outline" className="w-full sm:w-auto">
        <Download className="mr-2 h-4 w-4" />
        Exporter en CSV
      </Button>
      <Button onClick={() => exportIndividualPDF(props)} variant="outline" className="w-full sm:w-auto">
        <FileText className="mr-2 h-4 w-4" />
        Exporter en PDF
      </Button>
    </div>
  );
}

    