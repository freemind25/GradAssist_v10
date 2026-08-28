"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, Loader2, MessageSquareText, FileText, Users, BarChart3, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { EvaluationData } from "@/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiAssistantProps {
  evaluationData: EvaluationData;
  moduleName: string;
  moduleType: string;
}

const QUICK_ACTIONS = [
  {
    id: "comments",
    label: "Commentaires d'évaluation",
    icon: FileText,
    description: "Générer des commentaires personnalisés pour chaque étudiant",
    prompt: "Génère des commentaires d'évaluation personnalisés pour chaque étudiant du module. Inclus les forces, les axes d'amélioration et un conseil.",
  },
  {
    id: "attendance",
    label: "Analyse des présences",
    icon: BarChart3,
    description: "Analyser les tendances d'absentéisme et suggérer des actions",
    prompt: "Analyse les données de présence et identifie les tendances d'absentéisme. Propose des recommandations pour améliorer l'assiduité.",
  },
  {
    id: "thesis",
    label: "Synthèse encadrement",
    icon: Users,
    description: "Résumer l'avancement des mémoires encadrés",
    prompt: "Fais une synthèse de l'avancement des mémoires encadrés. Identifie les étudiants en retard et propose des actions correctives.",
  },
  {
    id: "report",
    label: "Rapport mensuel IA",
    icon: MessageSquareText,
    description: "Générer un rapport intelligent du mois",
    prompt: "Génère un rapport mensuel intelligent couvrant les évaluations, les présences et l'encadrement. Inclus des statistiques et des recommandations.",
  },
  {
    id: "planning",
    label: "Aide au planning",
    icon: BookOpen,
    description: "Suggestions de planning pour les cours restants",
    prompt: "En me basant sur le canevas du cours et l'avancement actuel, suggère un planning révisé pour les chapitres restants de la semaine.",
  },
];

export function AiAssistant({ evaluationData, moduleName, moduleType }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildContext = useCallback(() => {
    const d = evaluationData;
    const lines: string[] = [];

    lines.push(`Module: ${moduleName} (Type: ${moduleType})`);
    lines.push(`Université: ${d.universityName || "Non renseigné"}`);
    lines.push(`Département: ${d.departmentName || "Non renseigné"}`);
    lines.push(`Niveau: ${d.studyLevel || "Non renseigné"}`);
    lines.push(`Année académique: ${d.academicYear || "Non renseigné"}`);
    lines.push(`Enseignant(s): ${d.teacherNames.join(", ") || "Non renseigné"}`);

    if (d.studentNames.length > 0) {
      lines.push(`\nÉtudiants (${d.studentNames.length}): ${d.studentNames.join(", ")}`);
    }

    if (d.criteria.length > 0) {
      lines.push(`\nCritères d'évaluation (${d.criteria.length}):`);
      d.criteria.forEach((c) => {
        const grade = d.selectedGrades[c.id];
        lines.push(`  - ${c.name} (coefficient ${c.coefficient}): ${grade || "Non noté"}`);
      });
      lines.push(`Note totale: ${d.totalPoints}`);
    }

    if (d.continuousAssessmentGrade !== undefined) {
      lines.push(`\nNote CC: ${d.continuousAssessmentGrade}/${20 * ((d.continuousAssessmentWeight || 40) / 100)} (${d.continuousAssessmentWeight || 40}%)`);
    }
    if (d.examGrade !== undefined) {
      lines.push(`Note Examen: ${d.examGrade}/${20 * (1 - (d.continuousAssessmentWeight || 40) / 100)} (${100 - (d.continuousAssessmentWeight || 40)}%)`);
    }

    const attendanceEntries = Object.entries(d.attendance);
    if (attendanceEntries.length > 0) {
      lines.push(`\nPrésences (${attendanceEntries.length} séances):`);
      const studentStats: Record<string, { p: number; a: number; r: number; e: number }> = {};
      attendanceEntries.forEach(([, record]) => {
        Object.entries(record).forEach(([name, status]) => {
          if (!studentStats[name]) studentStats[name] = { p: 0, a: 0, r: 0, e: 0 };
          if (status === "present") studentStats[name].p++;
          else if (status === "absent") studentStats[name].a++;
          else if (status === "late") studentStats[name].r++;
          else if (status === "excused") studentStats[name].e++;
        });
      });
      Object.entries(studentStats).forEach(([name, stats]) => {
        const total = stats.p + stats.a + stats.r + stats.e;
        lines.push(`  - ${name}: ${stats.p}P/${stats.a}A/${stats.r}R/${stats.e}E (${total} séances)`);
      });
    }

    const thesisStudents = d.thesisStudents ?? [];
    if (thesisStudents.length > 0) {
      lines.push(`\nÉtudiants encadrés (${thesisStudents.length}):`);
      thesisStudents.forEach((s) => {
        lines.push(`  - ${s.firstName} ${s.lastName}: "${s.title}" | Statut: ${s.status} | Avancement: ${s.progress}% | Directeur: ${s.advisor}`);
        if (s.events.length > 0) {
          lines.push(`    Événements: ${s.events.length} (${s.events.filter((e) => !e.completed).length} à venir)`);
        }
      });
    }

    const chapters = d.syllabus?.chapters ?? [];
    if (chapters.length > 0) {
      lines.push(`\nCanevas du cours (${chapters.length} chapitres):`);
      const flatten = (chs: typeof chapters, depth = 0): void => {
        chs.forEach((ch) => {
          const prefix = "  ".repeat(depth + 1);
          const statusLabel = ch.status === "completed" ? "✅ Terminé" : ch.status === "in_progress" ? "🔄 En cours" : "⬜ Non commencé";
          lines.push(`${prefix}- ${ch.title} [${statusLabel}]`);
          if (ch.subchapters?.length > 0) flatten(ch.subchapters, depth + 1);
        });
      };
      flatten(chapters);
    }

    return lines.join("\n");
  }, [evaluationData, moduleName, moduleType]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      const apiKey = localStorage.getItem("gradeAssist_mistralApiKey");
      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: userMessage },
          {
            role: "assistant",
            content:
              "⚠️ Clé API Mistral non configurée. Allez dans l'onglet ⚙️ Informations Générales et entrez votre clé API Mistral AI.",
          },
        ]);
        return;
      }

      const userMsg: ChatMessage = { role: "user", content: userMessage };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      const context = buildContext();
      const systemPrompt = `Tu es l'assistant IA de GradeAssist, une application d'évaluation universitaire. Tu aides les enseignants à analyser leurs données d'évaluation, de présence et d'encadrement. Tu réponds en français, de manière concise et professionnelle.

Voici le contexte du module actuel:
${context}

Utilise ce contexte pour donner des réponses pertinentes et personnalisées. Si des données manquent, indique-le clairement.`;

      try {
        const res = await fetch("/api/mistral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: userMessage },
            ],
            apiKey,
          }),
        });

        const data = await res.json();
        if (data.error) {
          setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${data.error}` }]);
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "❌ Erreur de connexion. Vérifiez votre connexion internet." },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, buildContext]
  );

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    const fullPrompt = `${action.prompt}\n\nModule: ${moduleName}. Utilise toutes les données disponibles pour une réponse détaillée.`;
    sendMessage(fullPrompt);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-accent/30 text-accent hover:bg-accent/10 hover:text-accent"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">IA</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Assistant IA — Mistral AI
            <Badge variant="outline" className="text-[10px] font-normal ml-auto">
              {moduleName}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="px-6 py-3 border-b bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-2">Actions rapides</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] gap-1"
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading}
                >
                  <action.icon className="h-3 w-3" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Sparkles className="h-10 w-10 mx-auto mb-3 text-accent/40" />
                <p className="text-sm font-medium">Posez une question sur vos données</p>
                <p className="text-xs mt-1">
                  L&apos;IA a accès aux notes, présences, encadrement et canevas du cours.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Réflexion en cours...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="px-6 py-4 border-t bg-card">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Demandez une analyse, un commentaire, un rapport..."
              className="min-h-[44px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-11 w-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
