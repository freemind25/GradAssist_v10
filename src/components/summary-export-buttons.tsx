
"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import type { EvaluationData } from "@/types";
import { exportSummaryCSV, exportSummaryPDF } from "@/lib/export-service";

interface SummaryExportButtonsProps {
  allEvaluations: EvaluationData[];
  maxTotalPoints: number;
  moduleName: string;
}

export function SummaryExportButtons(props: SummaryExportButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button onClick={() => exportSummaryCSV(props)} variant="secondary" className="w-full sm:w-auto">
        <Download className="mr-2 h-4 w-4" />
        Exporter Synthèse (CSV)
      </Button>
      <Button onClick={() => exportSummaryPDF(props)} variant="secondary" className="w-full sm:w-auto">
        <FileText className="mr-2 h-4 w-4" />
        Exporter Synthèse (PDF)
      </Button>
    </div>
  );
}

    