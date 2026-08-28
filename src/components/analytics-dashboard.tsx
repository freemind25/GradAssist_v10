"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, TrendingUp, AlertTriangle, Award, Target } from "lucide-react";
import type { EvaluationData } from "@/types";
import { gradeLevels, TARGET_SUM_COEFFICIENTS } from "@/config/grading-config";

interface AnalyticsDashboardProps {
  evaluationData: EvaluationData;
  allSavedEvaluations: EvaluationData[];
  moduleName: string;
}

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];

function getMention(points: number, max: number): string {
  const pct = max > 0 ? (points / max) * 100 : 0;
  if (pct >= 90) return "Très Bien";
  if (pct >= 80) return "Bien";
  if (pct >= 70) return "Assez Bien";
  if (pct >= 60) return "Passable";
  if (pct >= 50) return "Insuffisant";
  return "Très Insuffisant";
}

function getMentionColor(points: number, max: number): string {
  const pct = max > 0 ? (points / max) * 100 : 0;
  if (pct >= 80) return "text-emerald-600 bg-emerald-50";
  if (pct >= 60) return "text-amber-600 bg-amber-50";
  if (pct >= 40) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

export function AnalyticsDashboard({ evaluationData, allSavedEvaluations, moduleName }: AnalyticsDashboardProps) {
  const d = evaluationData;
  const maxPoints = TARGET_SUM_COEFFICIENTS;

  // ── 1. Grade Distribution (histogram) ──
  const gradeDistribution = useMemo(() => {
    const ranges = [
      { name: "0-4", min: 0, max: 4, count: 0 },
      { name: "4-8", min: 4, max: 8, count: 0 },
      { name: "8-10", min: 8, max: 10, count: 0 },
      { name: "10-12", min: 10, max: 12, count: 0 },
      { name: "12-14", min: 12, max: 14, count: 0 },
      { name: "14-16", min: 14, max: 16, count: 0 },
      { name: "16-18", min: 16, max: 18, count: 0 },
      { name: "18-20", min: 18, max: 20, count: 0 },
    ];
    const allEvals = allSavedEvaluations.length > 0 ? allSavedEvaluations : [d];
    allEvals.forEach((e) => {
      const pts = e.totalPoints ?? 0;
      const range = ranges.find((r) => pts >= r.min && pts < r.max);
      if (range) range.count++;
    });
    return ranges;
  }, [d, allSavedEvaluations]);

  // ── 2. Criteria Average (bar chart) ──
  const criteriaAverage = useMemo(() => {
    return d.criteria.map((c) => {
      const grade = d.selectedGrades[c.id];
      const gradeLevel = gradeLevels.find((g) => g.name === grade);
      const points = gradeLevel ? gradeLevel.pointsFactor * c.coefficient : 0;
      const maxPossible = c.coefficient;
      return {
        name: c.name.length > 18 ? c.name.substring(0, 16) + "…" : c.name,
        fullName: c.name,
        notes: points,
        max: maxPossible,
        pourcentage: maxPossible > 0 ? Math.round((points / maxPossible) * 100) : 0,
      };
    });
  }, [d.criteria, d.selectedGrades]);

  // ── 3. Radar chart (student profile) ──
  const radarData = useMemo(() => {
    return d.criteria.map((c) => {
      const grade = d.selectedGrades[c.id];
      const gradeLevel = gradeLevels.find((g) => g.name === grade);
      const points = gradeLevel ? gradeLevel.pointsFactor * c.coefficient : 0;
      const maxPossible = c.coefficient;
      return {
        critere: c.name.length > 14 ? c.name.substring(0, 12) + "…" : c.name,
        valeur: maxPossible > 0 ? Math.round((points / maxPossible) * 100) : 0,
        fullMark: 100,
      };
    });
  }, [d.criteria, d.selectedGrades]);

  // ── 4. Attendance stats ──
  const attendanceStats = useMemo(() => {
    const records = Object.values(d.attendance);
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalSessions = 0;

    records.forEach((record) => {
      Object.values(record).forEach((status) => {
        totalSessions++;
        if (status === "present") totalPresent++;
        else if (status === "absent") totalAbsent++;
        else if (status === "late") totalLate++;
        else if (status === "excused") totalExcused++;
      });
    });

    const taux = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

    return {
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      totalSessions,
      taux,
      pieData: [
        { name: "Présent", value: totalPresent },
        { name: "Absent", value: totalAbsent },
        { name: "Retard", value: totalLate },
        { name: "Excusé", value: totalExcused },
      ].filter((item) => item.value > 0),
    };
  }, [d.attendance]);

  // ── 5. Quick stats ──
  const stats = useMemo(() => {
    const allEvals = allSavedEvaluations.length > 0 ? allSavedEvaluations : [d];
    const totalPoints = allEvals.map((e) => e.totalPoints ?? 0);
    const avg = totalPoints.reduce((a, b) => a + b, 0) / totalPoints.length;
    const max = Math.max(...totalPoints);
    const min = Math.min(...totalPoints);
    const median = (() => {
      const sorted = [...totalPoints].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    })();
    const variance = totalPoints.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / totalPoints.length;
    const ecartType = Math.sqrt(variance);

    return { avg, max, min, median, ecartType, count: totalPoints.length };
  }, [d, allSavedEvaluations]);

  // ── Pie slices for mentions ──
  const mentionsDistribution = useMemo(() => {
    const allEvals = allSavedEvaluations.length > 0 ? allSavedEvaluations : [d];
    const counts: Record<string, number> = {};
    allEvals.forEach((e) => {
      const mention = getMention(e.totalPoints ?? 0, maxPoints);
      counts[mention] = (counts[mention] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [d, allSavedEvaluations, maxPoints]);

  return (
    <div className="space-y-6">
      {/* ═══ Quick Stats Row ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Note Moyenne
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.avg.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/{maxPoints}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Award className="h-3.5 w-3.5" />
              Médiane
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.median.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/{maxPoints}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Target className="h-3.5 w-3.5" />
              Écart-Type
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {stats.ecartType.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" />
              Évaluations
            </div>
            <div className="text-2xl font-bold text-violet-600">
              {stats.count}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Charts Row 1 ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Distribution des Notes
            </CardTitle>
            <CardDescription>Répartition des notes sur {maxPoints} points</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gradeDistribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(value: number) => [`${value} évaluation(s)`, "Nombre"]}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Pie */}
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Statistiques de Présence
            </CardTitle>
            <CardDescription>
              Taux de présence : <Badge variant={attendanceStats.taux >= 75 ? "default" : "destructive"}>{attendanceStats.taux}%</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceStats.totalSessions > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={attendanceStats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {attendanceStats.pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 text-sm">
                  {attendanceStats.pieData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}:</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune donnée de présence</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Charts Row 2 ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criteria Average Bar */}
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Notes par Critère
            </CardTitle>
            <CardDescription>Points obtenus vs maximum par critère</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, criteriaAverage.length * 40)}>
              <BarChart data={criteriaAverage} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)} pts`,
                    name === "notes" ? "Obtenu" : name,
                  ]}
                />
                <Bar dataKey="notes" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Obtenu" />
                <Bar dataKey="max" fill="#e5e7eb" radius={[0, 4, 4, 0]} name="Maximum" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 via-violet-400 to-violet-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Profil de Compétences
            </CardTitle>
            <CardDescription>Spider chart par critère d&apos;évaluation</CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="critere" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="valeur" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Score"]} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune donnée de notation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Mentions Distribution ═══ */}
      {mentionsDistribution.length > 0 && (
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" />
              Répartition des Mentions
            </CardTitle>
            <CardDescription>Distribution des mentions sur {stats.count} évaluation(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {mentionsDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-sm font-medium">{item.name}</span>
                  <Badge variant="secondary">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Summary Table ═══ */}
      {allSavedEvaluations.length > 0 && (
        <Card className="card-premium overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Classement des Évaluations
            </CardTitle>
            <CardDescription>Toutes les évaluations sauvegardées, triées par note</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">N°</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Étudiant(s)</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Projet</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Note</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">%</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Mention</th>
                  </tr>
                </thead>
                <tbody>
                  {[...allSavedEvaluations]
                    .sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
                    .map((e, i) => {
                      const pct = maxPoints > 0 ? ((e.totalPoints ?? 0) / maxPoints) * 100 : 0;
                      const mention = getMention(e.totalPoints ?? 0, maxPoints);
                      const mentionColor = getMentionColor(e.totalPoints ?? 0, maxPoints);
                      return (
                        <tr key={i} className="border-b border-border/30 table-row-premium">
                          <td className="py-2.5 px-3 font-mono text-muted-foreground">{i + 1}</td>
                          <td className="py-2.5 px-3 font-medium">
                            {e.studentNames.filter((n) => n.trim()).join(" & ") || "N/A"}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[200px]">
                            {e.projectName || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold">
                            {(e.totalPoints ?? 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {pct.toFixed(0)}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mentionColor}`}>
                              {mention}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Alerts ═══ */}
      {attendanceStats.taux > 0 && attendanceStats.taux < 75 && (
        <Card className="border-amber-200 bg-amber-50/50 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Alerte Présence</p>
              <p className="text-xs text-amber-700">
                Le taux de présence est de {attendanceStats.taux}%. Il est recommandé de prendre des mesures pour améliorer l&apos;assiduité.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
