"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  BookCopy,
  Calculator,
  CalendarClock,
  ChevronRight,
  Download,
  FileBarChart,
  GraduationCap,
  HelpCircle,
  Mail,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    icon: BookCopy,
    title: "Créer un module",
    color: "text-primary",
    steps: [
      "Cliquez sur « Fichier → Nouveau Module » dans la barre du haut.",
      "Donnez un nom à la matière (ex : « Projet de Ville 2 »).",
      "Choisissez le type : Atelier (évaluation par critères) ou Matière classique (CC + Examen).",
      "Cliquez sur « Créer ». Le module apparaît dans les onglets.",
    ],
  },
  {
    icon: Settings,
    title: "Remplir les informations",
    color: "text-blue-600",
    steps: [
      "Allez dans l'onglet « ⚙️ Informations » via la barre latérale.",
      "Renseignez l'université, l'établissement, le département et le niveau d'étude.",
      "Ajoutez les noms des étudiants (ou importez une liste Excel).",
      "Ajoutez les noms des enseignants (maximum 3).",
      "Uploadez le logo de l'université pour les exports PDF.",
      "Renseignez l'email de l'administration pour l'envoi des rapports.",
    ],
  },
  {
    icon: GraduationCap,
    title: "Évaluer les étudiants",
    color: "text-amber-600",
    steps: [
      "Onglet « 🎓 Évaluation » — saisissez les noms des étudiants à évaluer.",
      "Pour les Ateliers : attribuez une note (P, A, B+, etc.) à chaque critère de la grille.",
      "La note finale se calcule automatiquement (barre de progression circulaire).",
      "Pour les Matières classiques : saisissez la note CC et la note Examen.",
      "Vous pouvez ajouter ou supprimer des critères d'évaluation.",
      "Exportez en PDF, CSV ou Excel depuis les boutons sous la note finale.",
    ],
  },
  {
    icon: UserCheck,
    title: "Gérer les présences",
    color: "text-emerald-600",
    steps: [
      "Onglet « 👥 Présences » — cliquez sur « Registre de Présence ».",
      "Sélectionnez une date dans le calendrier.",
      "Pour chaque étudiant, choisissez un statut : Présent (P), Absent (A), Retard (R), Excusé (E).",
      "Les données sont sauvegardées automatiquement.",
      "Exportez le rapport mensuel complet ou concis en PDF/CSV.",
      "Envoyez le rapport par email à l'administration (renseignez l'adresse dans Informations).",
    ],
  },
  {
    icon: BookOpen,
    title: "Suivre l'encadrement",
    color: "text-purple-600",
    steps: [
      "Onglet « 📖 Encadrement » — ajoutez les étudiants sous votre supervision.",
      "Pour chaque étudiant : nom, titre du mémoire, directeur, dates, avancement (%).",
      "Utilisez l'onglet « 📅 Agenda » pour planifier consultations et remises de chapitres.",
      "Utilisez l'onglet « ✉️ Messages » pour envoyer des emails au directeur de mémoire.",
    ],
  },
  {
    icon: Calculator,
    title: "Synthèse des évaluations",
    color: "text-rose-600",
    steps: [
      "Après avoir évalué un étudiant, cliquez sur « Ajouter à la Synthèse et Réinitialiser ».",
      "L'évaluation est sauvegardée et le formulaire se réinitialise pour le prochain étudiant.",
      "Exportez la synthèse complète (PDF ou CSV) avec tous les étudiants évalués.",
    ],
  },
  {
    icon: Download,
    title: "Exporter et sauvegarder",
    color: "text-cyan-600",
    steps: [
      "Toutes les données sont sauvegardées automatiquement dans le navigateur (localStorage).",
      "Utilisez les boutons d'export pour télécharger les rapports (PDF, CSV, Excel).",
      "Pour les fichiers Electron (.exe), les données restent sur votre PC — aucune connexion requise.",
    ],
  },
];

export function HelpGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Aide</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-primary-foreground" />
            </div>
            Notice d&apos;utilisation
          </DialogTitle>
          <DialogDescription>
            Guide complet pour utiliser GradeAssist — application d&apos;évaluation académique.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Quick start */}
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
            <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
              🚀 Démarrage rapide
            </h3>
            <ol className="text-sm text-foreground/80 space-y-1.5 list-decimal list-inside">
              <li>Remplissez les <strong>Informations Générales</strong> (université, département, étudiants).</li>
              <li>Passez à l&apos;onglet <strong>Évaluation</strong> pour noter les étudiants.</li>
              <li>Utilisez <strong>Présences</strong> pour suivre les absences.</li>
              <li>Utilisez <strong>Encadrement</strong> pour gérer les mémoires.</li>
              <li><strong>Exportez</strong> vos rapports en PDF ou envoyez-les par email.</li>
            </ol>
          </div>

          {/* Detailed sections */}
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b">
                  <Icon className={cn("h-4 w-4 shrink-0", section.color)} />
                  <h3 className="text-sm font-bold">{section.title}</h3>
                </div>
                <div className="px-4 py-3">
                  <ol className="text-sm text-foreground/80 space-y-1.5">
                    {section.steps.map((step, si) => (
                      <li key={si} className="flex items-start gap-2">
                        <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            );
          })}

          {/* Tips */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 dark:bg-amber-950/20 dark:border-amber-800/30">
            <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
              💡 Astuces
            </h3>
            <ul className="text-sm text-foreground/80 space-y-1.5">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Les données sont sauvegardées <strong>automatiquement</strong> dans votre navigateur. Aucune connexion internet n&apos;est requise.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Vous pouvez créer <strong>plusieurs modules</strong> (matières) et naviguer entre eux via les onglets en haut.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Le bouton <strong>« Ajouter à la Synthèse »</strong> permet de sauvegarder une évaluation et de passer à l&apos;étudiant suivant.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Pour envoyer un rapport d&apos;absences par email, renseignez d&apos;abord l&apos;adresse email de l&apos;administration dans l&apos;onglet Informations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Les exports PDF incluent le logo de l&apos;université si vous l&apos;avez uploardé.</span>
              </li>
            </ul>
          </div>

          {/* Keyboard shortcuts */}
          <div className="rounded-xl border p-4">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              ⌨️ Raccourcis
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-foreground/80">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">Fichier</kbd>
                <span>Créer / supprimer un module</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">Sidebar</kbd>
                <span>Naviguer entre les onglets</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">Export</kbd>
                <span>Télécharger en PDF/CSV/Excel</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">Email</kbd>
                <span>Envoyer rapport via mailto:</span>
              </div>
            </div>
          </div>

          {/* Version info */}
          <div className="text-center text-xs text-muted-foreground pt-2 border-t">
            <p>GradeAssist v10 — Application d&apos;évaluation académique</p>
            <p className="mt-0.5">Données 100% locales · Aucune connexion requise · Conçu par M.SADI</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
