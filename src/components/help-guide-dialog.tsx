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
  BookCopy,
  Calculator,
  Cloud,
  Download,
  GraduationCap,
  HelpCircle,
  LineChart,
  Map,
  Settings,
  Sparkles,
  UserCheck,
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
      "Vous pouvez créer plusieurs modules (matières) et naviguer entre eux via les onglets en haut.",
    ],
  },
  {
    icon: Settings,
    title: "Remplir les informations",
    color: "text-blue-600",
    steps: [
      "Allez dans l'onglet « ⚙️ Informations » via la barre latérale.",
      "Renseignez l'université, l'établissement, le département et le niveau d'étude.",
      "Ajoutez les noms des étudiants (ou importez une liste Excel via le bouton d'import).",
      "Ajoutez les noms des enseignants (maximum 3).",
      "Uploadez le logo de l'université pour les exports PDF.",
      "Renseignez l'email de l'administration pour l'envoi des rapports.",
      "Si vous disposez d'une clé API Mistral AI, collez-la dans le champ dédié pour activer l'assistant IA.",
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
      "Pour les Matières classiques : saisissez la note CC et la note Examen, puis ajustez la pondération.",
      "Vous pouvez ajouter ou supprimer des critères d'évaluation personnalisés.",
      "Cliquez sur « Ajouter à la Synthèse et Réinitialiser » pour sauvegarder et passer à l'étudiant suivant.",
      "Le bouton « ✨ IA » génère des commentaires d'évaluation personnalisés (nécessite une clé API Mistral).",
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
      "Consultez les statistiques de présence (taux, nombre de séances).",
      "Exportez le rapport mensuel complet ou concis en PDF/CSV.",
      "Envoyez le rapport par email à l'administration (renseignez l'adresse dans Informations).",
    ],
  },
  {
    icon: BookCopy,
    title: "Suivre l'encadrement",
    color: "text-purple-600",
    steps: [
      "Onglet « 📖 Encadrement » — ajoutez les étudiants sous votre supervision.",
      "Pour chaque étudiant : nom, titre du mémoire, directeur, dates, avancement (%).",
      "Utilisez l'onglet « 📅 Agenda » pour planifier consultations et remises de chapitres.",
      "Utilisez l'onglet « ✉️ Messages » pour envoyer des emails au directeur de mémoire.",
      "L'avancement est suivi via une barre de progression et des badges de statut colorés.",
    ],
  },
  {
    icon: Map,
    title: "Suivre le canevas du cours",
    color: "text-teal-600",
    steps: [
      "Onglet « 🗺️ Canevas » — importez le PDF du canevas officiel de la matière.",
      "Ajoutez les chapitres et sous-chapitres du programme.",
      "Pour chaque chapitre, cliquez sur le badge de statut pour le faire évoluer : Non commencé → En cours → Terminé.",
      "Définissez les dates prévisionnelles (début/fin) pour chaque chapitre.",
      "Consultez le Planning prévisionnel pour une vue chronologique de l'avancement.",
      "L'aperçu PDF du canevas est affiché en bas de page pour consultation rapide.",
      "Utilisez la barre de recherche pour filtrer les chapitres par titre ou notes.",
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
    title: "Exporter et imprimer",
    color: "text-cyan-600",
    steps: [
      "Export PDF individuel : la fiche d'évaluation d'un seul étudiant.",
      "Export CSV/Excel : tableau récapitulatif de toutes les évaluations.",
      "📥 PV des Notes : génère un PDF au format officiel algérien (liste des étudiants avec notes CC).",
      "Les exports incluent le logo de l'université si vous l'avez uploardé.",
      "Pour les présences, exportez le registre mensuel en PDF ou envoyez-le par email.",
    ],
  },
  {
    icon: LineChart,
    title: "Consulter le Dashboard",
    color: "text-orange-600",
    steps: [
      "Onglet « 📊 Dashboard » — visualisez les statistiques globales du module.",
      "Consultez les métriques rapides : note moyenne, médiane, écart-type.",
      "Analysez la distribution des notes via l'histogramme.",
      "Visualisez le taux de présence par graphique circulaire (donut).",
      "Le profil compétences (radar chart) montre la performance par critère.",
      "Le classement des évaluations est trié par note décroissante.",
      "Des alertes automatiques signalent si le taux de présence est inférieur à 75%.",
    ],
  },
  {
    icon: Sparkles,
    title: "Assistant IA (Mistral AI)",
    color: "text-violet-600",
    steps: [
      "Dans l'onglet Évaluation, cliquez sur « ✨ IA » pour ouvrir l'assistant.",
      "Choisissez une action rapide : Commentaires, Analyse des présences, Synthèse encadrement, Rapport mensuel, Aide au planning.",
      "L'assistant analyse les données du module et génère des réponses contextuelles en français.",
      "Vous pouvez aussi poser des questions libres sur vos données d'évaluation.",
      "⚠️ Nécessite une clé API Mistral AI (configurée dans Informations Générales → Clé API Mistral AI).",
    ],
  },
  {
    icon: Sparkles,
    title: "Obtenir une clé API Mistral AI (gratuit)",
    color: "text-indigo-600",
    steps: [
      "Ouvrez https://console.mistral.ai/ dans votre navigateur.",
      "Créez un compte avec votre email ou connectez-vous avec Google.",
      "Dans le menu latéral, cliquez sur « API Keys » (Clés API).",
      "Cliquez sur « Create new key » (Créer une nouvelle clé) en haut à droite.",
      "Donnez un nom explicite à votre clé (ex : « GradeAssist »).",
      "Définissez une date d'expiration (optionnel) et cliquez sur « Create ».",
      "Copiez immédiatement la clé affichée — elle ne sera plus jamais affichée ensuite !",
      "Collez la clé dans le champ « Clé API Mistral AI » de l'onglet Informations Générales.",
      "La clé est stockée localement dans votre navigateur (jamais envoyée à un serveur).",
      "💡 Le plan gratuit offre 1 million de tokens/mois — largement suffisant pour un usage universitaire.",
    ],
  },
  {
    icon: Cloud,
    title: "Synchronisation Cloud",
    color: "text-sky-600",
    steps: [
      "Indicateur de connexion en haut : ☁️ Cloud (connecté) ou 💾 Local (hors ligne).",
      "Menu « Fichier » → « 🔄 Synchroniser Cloud » : pousse les données vers Neon et les récupère.",
      "« 📤 Envoyer vers Cloud » : sauvegarde uniquement vos données vers le serveur.",
      "« 📥 Charger depuis Cloud » : récupère les données depuis le serveur.",
      "Toutes les données sont synchronisées : modules, notes, présences, encadrement, canevas.",
      "La synchronisation est optionnelle — l'application fonctionne parfaitement en mode local.",
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
              <li>Importez le <strong>Canevas</strong> officiel et suivez l&apos;avancement des cours.</li>
              <li>Consultez le <strong>Dashboard</strong> pour les statistiques et graphiques.</li>
              <li><strong>Exportez</strong> vos rapports en PDF, CSV ou envoyez-les par email.</li>
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
                        <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {si + 1}
                        </span>
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
                <span>Les données sont sauvegardées <strong>automatiquement</strong> dans votre navigateur. Aucune connexion internet n&apos;est requise pour le fonctionnement de base.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Vous pouvez créer <strong>plusieurs modules</strong> (matières) et naviguer entre eux via les onglets en haut.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Le bouton <strong>« Ajouter à la Synthèse »</strong> sauvegarde une évaluation et réinitialise le formulaire pour le prochain étudiant.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Pour envoyer un rapport par email, renseignez d&apos;abord l&apos;adresse email de l&apos;administration dans l&apos;onglet Informations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Les exports PDF incluent le logo de l&apos;université si vous l&apos;avez uploardé dans Informations Générales.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Activez la <strong>Synchronisation Cloud</strong> (Neon) pour sauvegarder vos données en ligne et y accéder depuis n&apos;importe quel appareil.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>L&apos;<strong>Assistant IA</strong> génère des commentaires et analyses contextuelles — configurez votre clé Mistral AI dans Informations pour l&apos;activer.</span>
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
                <span>Créer / supprimer / synchroniser</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">Sidebar</kbd>
                <span>Naviguer entre les onglets</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">Export</kbd>
                <span>PDF / CSV / Excel / PV</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">Email</kbd>
                <span>Envoyer rapport via mailto:</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">✨ IA</kbd>
                <span>Assistant IA contextualisé</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">Cloud</kbd>
                <span>Synchroniser avec Neon DB</span>
              </div>
            </div>
          </div>

          {/* Version info */}
          <div className="text-center text-xs text-muted-foreground pt-2 border-t">
            <p>GradeAssist v10 — Application d&apos;évaluation académique</p>
            <p className="mt-0.5">Données locales + Cloud · Assistant IA · Conçu par M.SADI</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
