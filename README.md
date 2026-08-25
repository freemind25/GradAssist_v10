# 🎓 GradeAssist — Application d'Évaluation Modulaire

**L'outil tout-en-un pour les enseignants et jurys universitaires.**

GradeAssist facilite et standardise le processus d'évaluation des travaux d'atelier et projets étudiants. Saisissez vos grilles de notation, gérez les présences, et générez des fiches d'évaluation professionnelles — le tout en quelques clics, 100 % hors ligne.

---

## ✨ Fonctionnalités

| Catégorie | Ce que fait GradeAssist |
|---|---|
| **Modules multiples** | Créez et gillez autant de matières/ateliers que nécessaire, chacun avec ses propres données |
| **Deux modes d'évaluation** | **Atelier** (grille de critères pondérés A+→F) ou **Matière classique** (CC + Examen) |
| **Grille de notation** | 8 critères prédéfinis (orale, poster, synthèse, innovation…) avec coefficients — ou ajoutez les vôtres |
| **Registre de présences** | Suivi séance par séance (Présent / Absent / Retard / Excusé) avec statistiques |
| **Import Excel** | Importez les noms de vos étudiants depuis un fichier Excel |
| **Logo université** | Ajoutez le logo de votre établissement — il apparaît sur les exports PDF |
| **Exports PDF** | Fiches d'évaluation individuelles avec en-tête institutionnel, grille de critères et note finale |
| **Exports CSV / Excel** | Synthèses de notes pour l'ensemble de vos étudiants |
| **Sauvegarde automatique** | Toutes vos données sont sauvegardées localement — rien n'est envoyé sur internet |
| **Desktop Windows** | Installez l'application sur votre PC comme n'importe quel logiciel |

---

## 📥 Télécharger et installer

> **Aucune connaissance technique requise.** Suivez ces 3 étapes :

### Étape 1 — Télécharger

Rendez-vous sur la page **[Releases](../../releases)** du dépôt GitHub et téléchargez le fichier :

```
GradeAssist-Setup-X.X.X.exe
```

> 💡 Cliquez sur la dernière version, puis sur le fichier `.exe` dans la section « Assets ».

### Étape 2 — Installer

1. Ouvrez le fichier `.exe` téléchargé
2. Si Windows affiche un avertissement de sécurité, cliquez sur **« Exécuter quand même »**
3. L'assistant d'installation s'ouvre :
   - Cliquez **Suivant**
   - Choisissez le dossier d'installation (ou laissez par défaut)
   - Cochez **Créer un raccourci Bureau** ✅
   - Cliquez **Installer**, puis **Terminer**

### Étape 3 — Utiliser

Double-cliquez sur le raccourci **GradeAssist** sur votre Bureau ou dans le menu Démarrer.

> 🎉 L'application s'ouvre automatiquement. Aucune connexion internet n'est nécessaire.

---

## 📸 Aperçu des fonctionnalités

### Écran principal
L'écran principal affiche un header avec le nom de votre université, un sélecteur de module actif, et la barre de menus pour créer/supprimer des matières.

### Mode Atelier
Une grille d'évaluation complète avec 8 critères pondérés. Sélectionnez une note par critère — le total se met à jour en temps réel avec un code couleur (vert = bien, rouge = à revoir).

### Mode Matière classique
Saisissez votre note de CC et votre note d'examen, ajustez le coefficient du CC avec un slider, et la note finale est calculée automatiquement.

### Présences
Un tableau interactif date × étudiant. Cliquez pour faire défiler les statuts : Présent → Absent → Retard → Excusé. Statistiques de présence en temps réel.

---

## 🛠 Développement (contributeurs)

### Prérequis

- [Node.js](https://nodejs.org/) ≥ 20
- npm (ou bun)

### Installation

```bash
git clone <url-du-depot>
cd gradeassist
npm install
```

### Lancer en mode développement

```bash
npm run dev          # Next.js seul — http://localhost:3000
npm run electron:dev # App Electron (build Next.js + fenêtre desktop)
```

### Lancer les tests

```bash
npm run lint         # Vérification du code (ESLint)
npm run typecheck    # Vérification TypeScript
npm run quality      # Les deux d'un coup
npm run cy:open      # Tests E2E interactifs (Cypress)
npm run cy:run       # Tests E2E en mode headless
```

---

## 📦 Builder l'installeur Windows

### Depuis la ligne de commande

```bash
npm run electron:build
```

Le fichier `.exe` sera généré dans `dist-electron/`.

### Depuis GitHub Actions (recommandé)

Quand vous poussez un tag de version, GitHub Actions build automatiquement l'installeur et le publie sur les Releases :

```bash
git tag v1.0.0
git push origin v1.0.0
```

Les utilisateurs peuvent alors télécharger le `.exe` depuis la page Releases.

---

## 🏗 Architecture du projet

```
GradeAssist/
│
├── src/                          # Code source de l'application
│   ├── app/
│   │   ├── layout.tsx            # Layout racine (polices, Toaster)
│   │   ├── page.tsx              # Page principale — orchestrateur des modules
│   │   └── globals.css           # Variables CSS (thème ShadCN)
│   │
│   ├── components/
│   │   ├── evaluation-module.tsx # Conteneur d'un module (Atelier ou Standard)
│   │   ├── grade-table.tsx       # Grille d'évaluation par critères
│   │   ├── attendance-registry.tsx # Registre de présences
│   │   ├── student-project-info-form.tsx # Formulaire infos étudiant/projet
│   │   ├── standard-module-form.tsx     # Formulaire module CC/Examen
│   │   ├── export-buttons.tsx    # Boutons export fiche individuelle
│   │   ├── summary-export-buttons.tsx   # Boutons export synthèse
│   │   └── ui/                   # Composants ShadCN UI (Radix-based)
│   │
│   ├── config/
│   │   └── grading-config.ts     # Critères par défaut, barèmes A+→F
│   │
│   ├── hooks/                    # Hooks React personnalisés
│   ├── lib/
│   │   ├── export-service.ts     # Génération PDF + CSV + Excel
│   │   └── utils.ts              # Utilitaire cn() (clsx + tailwind-merge)
│   │
│   ├── types/
│   │   └── index.ts              # Types TypeScript partagés
│   │
│   └── ai/                       # Genkit / Gemini (IA — futur)
│
├── electron/
│   ├── main.js                   # Processus principal Electron
│   ├── icon.ico                  # Icône de l'application
│   └── standalone/               # (généré) Copie de la sortie Next.js
│
├── scripts/
│   └── copy-standalone.js        # Copie la sortie standalone pour Electron
│
├── cypress/                      # Tests E2E (8 suites)
│   └── e2e/
│       ├── 00-smoke.cy.ts        # Parcours critiques
│       ├── 01-chargement.cy.ts
│       ├── 02-gestion-modules.cy.ts
│       ├── 03-informations-evaluation.cy.ts
│       ├── 04-grille-evaluation.cy.ts
│       ├── 05-presences.cy.ts
│       ├── 06-exports.cy.ts
│       └── 07-accessibilite-responsive.cy.ts
│
├── .github/workflows/
│   ├── ci.yml                    # CI : lint + typecheck + build + Cypress
│   └── release.yml               # CD : build .exe + publier sur Releases
│
├── next.config.ts                # Configuration Next.js (output: standalone)
├── tailwind.config.ts            # Configuration Tailwind CSS
├── tsconfig.json                 # Configuration TypeScript
├── components.json               # Configuration ShadCN UI
└── package.json
```

---

## 🧩 Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router, standalone) | 15.x |
| Desktop | Electron + electron-builder (NSIS) | 33.x / 26.x |
| Langage | TypeScript | 5.x |
| UI | ShadCN UI (Radix + Tailwind CSS) | — |
| Icônes | Lucide React | — |
| Polices | Geist (Sans + Mono) | — |
| Dates | date-fns (locale `fr`) | 3.x |
| PDF | jsPDF + autoTable | 2.5 / 3.8 |
| Excel | SheetJS (xlsx) | 0.18 |
| IA | Genkit + Google AI (Gemini 2.0 Flash) | 1.8 |
| Tests E2E | Cypress | 14.x |
| CI/CD | GitHub Actions | — |

---

## 📋 Commandes disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement Next.js (port 3000) |
| `npm run build` | Build de production Next.js |
| `npm run start` | Serveur de production Next.js |
| `npm run lint` | Vérification du code (ESLint) |
| `npm run typecheck` | Vérification TypeScript (sans émission) |
| `npm run quality` | lint + typecheck enchaînés |
| `npm run electron:dev` | App Electron en mode développement |
| `npm run electron:build` | Builder l'installeur Windows (.exe) |
| `npm run electron:pack` | Pack sans installer (dossier décompressé) |
| `npm run cy:open` | Tests E2E interactifs (Cypress) |
| `npm run cy:run` | Tests E2E headless |

---

## 🔒 Confidentialité des données

GradeAssist fonctionne **entièrement hors ligne**. Aucune donnée n'est envoyée sur internet :

- **Sauvegarde** : LocalStorage de l'application (fichier local sur votre PC)
- **Exports** : PDF, CSV et Excel générés côté client — jamais de serveur externe
- **Pas de compte** : aucune inscription requise, aucune connexion requise

> ⚠️ Pensez à sauvegarder régulièrement vos données en exportant des copies CSV ou Excel de vos synthèses.

---

## 🗺 Évolutions prévues

- [ ] Authentification enseignant
- [ ] Synchronisation cloud optionnelle
- [ ] Dashboard KPI multi-modules
- [ ] Module IA : commentaires de jury automatiques (Genkit / Gemini)
- [ ] Application mobile (PWA)
- [ ] Import/export de grilles de critères personnalisées
- [ ] Rapport mensuel automatisé

---

## 📄 Documentation complémentaire

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Documentation technique de référence — architecture, modèle de données, flux |
| [CAHIER_DES_CHARGES.md](./CAHIER_DES_CHARGES.md) | Cahier des charges complet de l'application |
| [blueprint.md](./docs/blueprint.md) | Blueprint de conception |

---

*Designed by M. SADI — © 2025 GradeAssist. Tous droits réservés.*
