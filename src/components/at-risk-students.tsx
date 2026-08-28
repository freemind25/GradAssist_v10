"use client";

import { useMemo } from "react";
import type { AttendanceData, QuickNote, AtRiskConfig } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Users, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AtRiskStudentsProps {
  studentNames: string[];
  attendance: AttendanceData;
  totalPoints: number;
  quickNotes: QuickNote[];
  atRiskConfig: AtRiskConfig;
}

interface AtRiskStudent {
  name: string;
  reasons: string[];
  attendanceRate: number;
  averageNote: number;
  riskLevel: "high" | "medium" | "low";
}

function computeAttendanceRate(studentName: string, attendance: AttendanceData): number {
  const dates = Object.keys(attendance);
  if (dates.length === 0) return 100; // No data = assume present

  let presentCount = 0;
  let totalCount = 0;

  for (const date of dates) {
    const record = attendance[date];
    if (record && record[studentName] !== undefined) {
      totalCount++;
      if (record[studentName] === "present" || record[studentName] === "excused") {
        presentCount++;
      }
    }
  }

  if (totalCount === 0) return 100;
  return Math.round((presentCount / totalCount) * 100);
}

export function AtRiskStudents({
  studentNames,
  attendance,
  totalPoints,
  quickNotes,
  atRiskConfig,
}: AtRiskStudentsProps) {
  const atRiskStudents = useMemo(() => {
    const validStudents = studentNames.filter((n) => n.trim());
    const students: AtRiskStudent[] = [];

    for (const name of validStudents) {
      const reasons: string[] = [];
      const attendanceRate = computeAttendanceRate(name, attendance);
      const averageNote = totalPoints; // Using total points as a proxy

      // Check attendance
      if (attendanceRate < atRiskConfig.attendanceThreshold) {
        reasons.push(
          `Présence faible (${attendanceRate}% < ${atRiskConfig.attendanceThreshold}%)`
        );
      }

      // Check for negative quick notes
      const negativeNotes = quickNotes.filter(
        (n) => n.studentName === name && n.type === "negative"
      );
      if (negativeNotes.length >= 3) {
        reasons.push(`${negativeNotes.length} notes négatives`);
      }

      if (reasons.length > 0) {
        const riskLevel: "high" | "medium" | "low" =
          reasons.length >= 2 || attendanceRate < 50 ? "high" : reasons.length === 1 ? "medium" : "low";

        students.push({
          name,
          reasons,
          attendanceRate,
          averageNote,
          riskLevel,
        });
      }
    }

    // Sort by risk level (high first)
    return students.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.riskLevel] - order[b.riskLevel];
    });
  }, [studentNames, attendance, totalPoints, quickNotes, atRiskConfig]);

  const riskColors = {
    high: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
    medium: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
    low: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30",
  };

  const riskBadgeColors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    low: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  };

  const riskLabels = {
    high: "Risque élevé",
    medium: "Risque moyen",
    low: "À surveiller",
  };

  return (
    <Card className="card-premium overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-red-500/60 via-red-500 to-red-500/60" />
      <CardHeader className="bg-gradient-to-r from-red-500/5 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Étudiants à risque
        </CardTitle>
      </CardHeader>
      <CardContent>
        {atRiskStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <XCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-600">Aucun étudiant à risque détecté</p>
            <p className="text-xs mt-1">
              Seuils actuels : Présence &lt; {atRiskConfig.attendanceThreshold}% | Notes &lt; {atRiskConfig.gradeThreshold}/20
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{atRiskStudents.length} étudiant(s) à risque</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-500">
                <TrendingDown className="h-4 w-4" />
                <span>{atRiskStudents.filter((s) => s.riskLevel === "high").length} risque élevé</span>
              </div>
            </div>

            {/* Student cards */}
            {atRiskStudents.map((student) => (
              <div
                key={student.name}
                className={cn(
                  "rounded-lg border p-3 transition-all",
                  riskColors[student.riskLevel]
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{student.name}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          riskBadgeColors[student.riskLevel]
                        )}
                      >
                        {riskLabels[student.riskLevel]}
                      </span>
                    </div>
                    <ul className="space-y-0.5">
                      {student.reasons.map((reason, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-red-400">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <div>Présence: {student.attendanceRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
