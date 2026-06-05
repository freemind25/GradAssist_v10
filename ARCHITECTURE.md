# ARCHITECTURE.md — GradeAssist v10

> Documentation technique de référence. Mise à jour : mai 2025.  
> Auteur : M. SADI

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technologique](#2-stack-technologique)
3. [Structure du projet](#3-structure-du-projet)
4. [Architecture applicative](#4-architecture-applicative)
5. [Modèle de données](#5-modèle-de-données)
6. [Composants principaux](#6-composants-principaux)
7. [Services et librairies](#7-services-et-librairies)
8. [Flux de données](#8-flux-de-données)
9. [Exports (PDF / CSV / Excel)](#9-exports-pdf--csv--excel)
10. [Intelligence artificielle (Genkit)](#10-intelligence-artificielle-genkit)
11. [Tests E2E (Cypress)](#11-tests-e2e-cypress)
12. [CI/CD et qualité](#12-cicd-et-qualité)
13. [Décisions techniques](#13-décisions-techniques)
14. [Évolutions prévues](#14-évolutions-prévues)

---

## 1. Vue d'ensemble

**GradeAssist** est une application web Single Page destinée aux enseignants et jurys universitaires pour :

- Gérer plusieurs **modules** d'évaluation simultanément (Atelier ou Matière standard)
- Saisir les **grilles de notation** par critères pondérés (système A+→F)
- Suivre les **présences** séance par séance (P/A/Retard/Excusé)
- Générer des **exports PDF, CSV et Excel** individuels et de synthèse
- Persister toutes les données **localement** (LocalStorage, sans serveur)

L'application fonctionne entièrement côté client : aucune infrastructure backend n'est requise pour l'utilisation de base. Une couche IA (Genkit / Gemini) est intégrée pour des fonctionnalités d'assistance futures.

```
┌─────────────────────────────────────────────────────────┐
│                     Navigateur Web                      │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ page.tsx │→ │Evaluation│→ │GradeTable│→ │Attend. │  │
│  │ (root)   │  │Module    │  │          │  │Registry│  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│        ↕                                                │
│  ┌─────────────────────┐   ┌─────────────────────────┐  │
│  │   LocalStorage      │   │   export-service.ts     │  │
│  │  (persistance data) │   │  (jsPDF / xlsx / CSV)   │  │
│  └─────────────────────┘   └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Stack technologique

| Couche | Technologie | Version | Rôle |
|---|---|---|---|
| Framework | **Next.js** | 15.2.8 | App Router, SSG/SSR, routing |
| Langage | **TypeScript** | ~5.x | Typage statique strict |
| UI | **ShadCN UI** | — | Composants accessibles Radix |
| Style | **Tailwind CSS** | ^3.x | Utility-first CSS |
| Icônes | **Lucide React** | — | Icônes SVG |
| Polices | **Geist** (Google Fonts) | — | Geist Sans + Mono |
| Date | **date-fns** | ^3.6 | Manipulation de dates (locale `fr`) |
| PDF | **jsPDF + autoTable** | ^2.5 / ^3.8 | Génération PDF côté client |
| Excel | **xlsx (SheetJS)** | ^0.18 | Import/Export Excel |
| IA | **Genkit + Google AI** | ^1.8 | Assistance IA (Gemini 2.0 Flash) |
| State | **React useState/useEffect** | 18.3 | Gestion d'état local |
| Persistance | **LocalStorage** | — | Stockage navigateur sans serveur |
| Tests E2E | **Cypress** | ^14.x | Tests bout en bout |
| Lint | **ESLint** (next) | — | Qualité du code |
| CI | **GitHub Actions** | — | Lint + Build sur chaque push |

---

## 3. Structure du projet

```
GradeAssist_v8/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout racine (Toaster, polices Geist)
│   │   ├── page.tsx                # Page principale — orchestrateur des modules
│   │   └── globals.css             # Variables CSS (thème ShadCN)
│   │
│   ├── components/
│   │   ├── evaluation-module.tsx   # Conteneur d'un module (Atelier ou Standard)
│   │   ├── grade-table.tsx         # Grille d'évaluation par critères
│   │   ├── attendance-registry.tsx # Registre de présences
│   │   ├── student-project-info-form.tsx  # Formulaire infos étudiant/projet
│   │   ├── standard-module-form.tsx       # Formulaire module Standard (CC/Exam)
│   │   ├── export-buttons.tsx      # Boutons export fiche individuelle
│   │   ├── summary-export-buttons.tsx     # Boutons export synthèse
│   │   └── ui/                     # 23 composants ShadCN (Radix-based)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── toast.tsx / toaster.tsx
│   │       └── … (18 autres)
│   │
│   ├── config/
│   │   └── grading-config.ts       # Critères par défaut, barèmes, niveaux A+→F
│   │
│   ├── hooks/
│   │   ├── use-toast.ts            # Hook toast notifications
│   │   └── use-mobile.tsx          # Hook détection mobile (breakpoint 768px)
│   │
│   ├── lib/
│   │   ├── export-service.ts       # Service centralisé PDF + CSV
│   │   └── utils.ts                # Utilitaire cn() (clsx + tailwind-merge)
│   │
│   ├── types/
│   │   └── index.ts                # Types TypeScript partagés
│   │
│   └── ai/
│       ├── genkit.ts               # Configuration Genkit (Gemini 2.0 Flash)
│       └── dev.ts                  # Point d'entrée dev Genkit
│
├── cypress/
│   ├── e2e/                        # 8 suites de tests E2E
│   │   ├── 00-smoke.cy.ts          # Parcours critiques bout en bout
│   │   ├── 01-chargement.cy.ts     # Chargement initial
│   │   ├── 02-gestion-modules.cy.ts # Création/sélection/suppression modules
│   │   ├── 03-informations-evaluation.cy.ts
│   │   ├── 04-grille-evaluation.cy.ts
│   │   ├── 05-presences.cy.ts
│   │   ├── 06-exports.cy.ts
│   │   └── 07-accessibilite-responsive.cy.ts
│   ├── fixtures/
│   │   ├── module-atelier.json     # Données de test Atelier
│   │   └── module-standard.json   # Données de test Matière Standard
│   └── support/
│       ├── e2e.ts                  # Bootstrap Cypress
│       └── commands.ts             # Commandes personnalisées
│
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions (lint + typecheck + build + Cypress)
│
├── cypress.config.ts               # Configuration Cypress
├── next.config.ts                  # Configuration Next.js
├── tailwind.config.ts              # Configuration Tailwind
├── tsconfig.json                   # Configuration TypeScript
├── package.json
├── CAHIER_DES_CHARGES.md
├── ARCHITECTURE.md                 # Ce fichier
└── README.md
```

---

## 4. Architecture applicative

### 4.1 Pattern : State-up / Props-down

L'application suit un pattern de gestion d'état classique React sans store externe :

```
page.tsx (State owner)
│
│  modules: EvaluationModule[]          ← tableau de tous les modules
│  activeModuleId: string | null        ← module sélectionné
│
├─→ EvaluationModule (activeModule)
│       │
│       ├─→ StudentProjectInfoForm      (evaluationData, onUpdate)
│       ├─→ GradeTable                  (criteria, selectedGrades, onUpdate)
│       ├─→ AttendanceRegistry          (attendance, setAttendance)
│       ├─→ ExportButtons               (evaluationData)
│       └─→ SummaryExportButtons        (savedEvaluations)
│
└─→ [Select Module] + [NewModuleDialog] + [AlertDialog Suppression]
```

### 4.2 Types de modules

| Type | Identifiant | Description |
|---|---|---|
| **Atelier** | `'atelier'` | Évaluation par grille de critères pondérés, présences intégrées |
| **Standard** | `'standard'` | Note CC + Note Examen + coefficient CC (en %) |

### 4.3 Persistance LocalStorage

Deux clés de stockage :

| Clé | Contenu |
|---|---|
| `gradeAssist_modules` | `EvaluationModule[]` — tous les modules sérialisés en JSON |
| `gradeAssist_activeModuleId` | `string` — ID du module actif |

La sauvegarde est déclenchée automatiquement par un `useEffect` réactif sur `[modules, activeModuleId]`. Le chargement initial se fait au montage du composant racine, avec fallback vers un module Atelier par défaut si le localStorage est vide.

---

## 5. Modèle de données

### 5.1 Types principaux (`src/types/index.ts`)

```typescript
// Un critère d'évaluation
interface Criterion {
  id: string;           // identifiant unique (ex: 'oral', 'custom_123')
  name: string;         // libellé
  details?: string;     // sous-libellé optionnel
  coefficient: number;  // pondération (somme cible = 20)
}

// Les notes sélectionnées pour une évaluation
interface SelectedGrades {
  [criterionId: string]: string | undefined;  // ex: '3.5' ou undefined
}

// Statut de présence
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// Registre de présences : date → étudiant → statut
interface AttendanceData {
  [date: string]: {       // format 'yyyy-MM-dd'
    [studentName: string]: AttendanceStatus;
  };
}

// Données complètes d'une évaluation
interface EvaluationData {
  id: string;
  studentNames: string[];
  projectName: string;
  studyLevel: string;         // 'Licence' | 'Master'
  studySubLevel: string;      // 'L1'...'L3' | 'M1'...'M3'
  session: string;
  academicYear: string;       // ex: '2024-2025'
  universityName: string;
  establishmentName: string;
  departmentName: string;
  masterSpecialty: string;
  universityLogo: string | null;   // base64 Data URL
  teacherNames: string[];
  
  // Atelier
  criteria: Criterion[];
  selectedGrades: SelectedGrades;
  totalPoints: number;
  attendance: AttendanceData;

  // Standard
  continuousAssessmentGrade?: number;
  examGrade?: number;
  continuousAssessmentWeight?: number;  // ex: 40 pour 40%

  evaluationSheetTitleComplement: string;
}

// Module complet (Atelier ou Standard)
interface EvaluationModule {
  id: string;               // 'module_<timestamp>'
  name: string;
  type: ModuleType;         // 'atelier' | 'standard'
  evaluationData: EvaluationData;
}
```

### 5.2 Configuration des barèmes (`src/config/grading-config.ts`)

```typescript
// 8 critères par défaut, somme coefficients = 20
const DEFAULT_CRITERIA: Criterion[] = [
  { id: 'oral',       name: 'Présentation orale',         coefficient: 4 },
  { id: 'poster',     name: 'Présentation Affichée',      coefficient: 4 },
  { id: 'synthesis',  name: 'Esprit de synthèse',         coefficient: 3 },
  { id: 'innovation', name: 'Innovation',                 coefficient: 3 },
  { id: 'peerEval',   name: 'Évaluation par les pairs',   coefficient: 2 },
  { id: 'objectives', name: 'Atteinte des objectifs …',   coefficient: 2 },
  { id: 'fieldTrips', name: 'Sorties sur terrains',       coefficient: 1 },
  { id: 'attendance', name: 'Assiduité',                  coefficient: 1 },
];

// 11 niveaux de notation
const gradeLevels: GradeLevel[] = [
  { name: 'A+', pointsFactor: 1.0,  percentageDisplay: '90-100%' },
  { name: 'A',  pointsFactor: 0.89, percentageDisplay: '85-89%'  },
  // … jusqu'à F (0-39%)
];

const TARGET_SUM_COEFFICIENTS = 20;  // total max = 20 points
```

---

## 6. Composants principaux

### 6.1 `page.tsx` — Orchestrateur

**Responsabilités :**
- Chargement et sauvegarde LocalStorage
- Gestion de l'état global (`modules[]`, `activeModuleId`)
- Rendu du header, de la barre de menus, du sélecteur de module
- Délégation du rendu à `EvaluationModule`

**Sous-composant interne :** `NewModuleDialog` — dialog de création avec choix du nom et du type.

---

### 6.2 `EvaluationModule` — Conteneur métier

Composant clé qui orchestre tous les sous-composants d'un module. Reçoit `module: EvaluationModuleType` et `onUpdate` en props. Gère :
- L'affichage conditionnel Atelier vs Standard
- La collection des évaluations sauvegardées (`savedEvaluations`)
- La propagation des mises à jour vers `page.tsx`

---

### 6.3 `GradeTable` — Grille d'évaluation

- Affiche un tableau critères × niveaux de notation
- Calcul dynamique des points par critère (`coefficient × pointsFactor`)
- Feedback visuel par couleur selon le niveau sélectionné
- Ajout/suppression de critères personnalisés
- Total des points mis à jour en temps réel

---

### 6.4 `AttendanceRegistry` — Présences

- Sélecteur de date (Popover + Calendar date-fns/fr)
- Tableau étudiant × séance avec cycler de statut P/A/R/E au clic
- Statistiques : taux de présence, nombre de séances
- Export PDF du registre mensuel (jsPDF + autoTable)

---

### 6.5 `StudentProjectInfoForm` — Formulaire

- Champs étudiants dynamiques (jusqu'à 5, ajout/suppression)
- Import noms depuis Excel (SheetJS — parsing côté client)
- Champs enseignants dynamiques (jusqu'à 3)
- Upload logo université (validation : PNG/JPG/SVG, max 2 Mo)
- Sélection contextuelle du sous-niveau (L1→L3 ou M1→M3)

---

### 6.6 `StandardModuleForm` — Module matière

- Note CC (0-20), Note Examen (0-20)
- Slider coefficient CC (0-100%)
- Calcul note finale : `note = (CC × poids) + (Exam × (1 - poids))`
- Affichage mention correspondante

---

## 7. Services et librairies

### 7.1 `export-service.ts` — Service d'export centralisé

**`exportIndividualPDF(params)`**
1. Instancie `jsPDF` en orientation portrait A4
2. Intègre le logo (base64) s'il est fourni
3. Génère l'en-tête institutionnel (université, faculté, département)
4. Génère la grille des critères via `autoTable`
5. Calcule et affiche la note finale et la mention
6. Déclenche le téléchargement via `doc.save()`

**`exportSummaryCSV(params)`**
1. Construit un tableau 2D (headers + lignes étudiants)
2. Sérialise en CSV (séparateur `;`, encodage UTF-8 avec BOM)
3. Crée un Blob et déclenche le téléchargement

**`exportSummaryExcel(params)`**
1. Crée un workbook SheetJS
2. Construit la feuille avec en-têtes et données
3. Applique les largeurs de colonnes
4. Déclenche le téléchargement `.xlsx`

---

### 7.2 `src/ai/genkit.ts` — Intelligence artificielle

```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: 'googleai/gemini-2.0-flash',
});
```

**Configuration requise :** variable d'environnement `GOOGLE_GENAI_API_KEY`.  
**Usage actuel :** fondation pour futures fonctionnalités (suggestions de notes, analyse de présences, génération de commentaires de jury).

---

### 7.3 `utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Fusion sécurisée de classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 8. Flux de données

### 8.1 Création d'un module

```
Clic "Nouveau" → NewModuleDialog
  → Saisie nom + type
  → handleCreateModule(name, type)
    → getNewEvaluationModule(type, name)  // initialise avec DEFAULT_CRITERIA
    → setModules([...modules, newModule])
    → setActiveModuleId(newModule.id)
    → useEffect → localStorage.setItem(...)
```

### 8.2 Mise à jour d'une note

```
GradeTable → sélection note pour critère X
  → onGradeChange(criterionId, gradeValue)
    → updateEvaluationData({ selectedGrades: {..., [criterionId]: gradeValue} })
      → EvaluationModule.onUpdate(partialData)
        → page.tsx.handleUpdateModule(moduleId, update)
          → setModules(modules.map(m => m.id === id ? {...m, ...update} : m))
            → useEffect → localStorage.setItem(...)
```

### 8.3 Export PDF

```
Clic "Fiche PDF" → ExportButtons
  → exportIndividualPDF(evaluationData)
    → jsPDF instancié
    → logo ajouté (si base64 fourni)
    → autoTable(critères, notes, points)
    → doc.save("fiche_evaluation_[nom].pdf")
      → téléchargement navigateur
```

---

## 9. Exports (PDF / CSV / Excel)

| Format | Librairie | Contenu | Déclencheur |
|---|---|---|---|
| PDF individuel | jsPDF + autoTable | En-tête institutionnel, logo, grille critères, note finale | `ExportButtons` |
| PDF registre | jsPDF + autoTable | Tableau présences mensuel par étudiant | `AttendanceRegistry` |
| CSV synthèse | natif (Blob) | Toutes évaluations du module en tableau | `SummaryExportButtons` |
| Excel synthèse | SheetJS (xlsx) | Workbook avec feuille de synthèse | `SummaryExportButtons` |

**Nota Bene :** tous les exports sont générés **côté client**, sans appel serveur. Aucune donnée n'est transmise à un tiers.

---

## 10. Intelligence artificielle (Genkit)

### Configuration

- **Framework IA :** Firebase Genkit v1.8
- **Modèle :** `googleai/gemini-2.0-flash`
- **Plugin :** `@genkit-ai/googleai`
- **Intégration Next.js :** `@genkit-ai/next`

### Variables d'environnement requises

```env
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
```

### Fonctionnalités IA prévues (roadmap)

- Génération automatique de commentaires de jury personnalisés
- Suggestions de redistribution de coefficients selon le profil du groupe
- Analyse des tendances de présences et alertes précoces
- Résumé automatique des évaluations pour les rapports

---

## 11. Tests E2E (Cypress)

### Prérequis

```bash
npm install cypress --save-dev
npx cypress install
```

### Structure des suites

| Fichier | Couverture |
|---|---|
| `00-smoke.cy.ts` | Parcours critiques bout en bout (chargement → création → export) |
| `01-chargement.cy.ts` | Chargement initial, état par défaut, localStorage |
| `02-gestion-modules.cy.ts` | Création (Atelier/Standard), sélection, suppression, persistance |
| `03-informations-evaluation.cy.ts` | Formulaire étudiant/projet, upload logo, CC/Examen |
| `04-grille-evaluation.cy.ts` | Grille critères, sélection notes, calcul total |
| `05-presences.cy.ts` | Registre présences, sélection date, statuts P/A/R/E |
| `06-exports.cy.ts` | Boutons export PDF/CSV/Excel, sécurité fichiers |
| `07-accessibilite-responsive.cy.ts` | Labels, focus, viewports 375/768/1280px |

### Commandes d'exécution

```bash
# Mode interactif (navigateur ouvert)
npx cypress open

# Mode headless (CI)
npx cypress run

# Suite spécifique
npx cypress run --spec "cypress/e2e/00-smoke.cy.ts"

# Avec l'app en cours d'exécution
npm run dev &
npx cypress run
```

### Commandes personnalisées

| Commande | Paramètres | Description |
|---|---|---|
| `cy.waitForApp()` | — | Attend que l'hydratation Next.js soit complète |
| `cy.createModule(name, type?)` | `name: string, type: 'atelier'|'standard'` | Crée un module via le dialog |
| `cy.selectModule(partialName)` | `partialName: string` | Sélectionne un module via le Select |
| `cy.fillStudentInfo(field, value)` | `field: string, value: string` | Remplit un champ du formulaire |

---

## 12. CI/CD et qualité

### Pipeline GitHub Actions (`.github/workflows/ci.yml`)

```
Push / PR → main
  │
  ├── Job: quality
  │     ├── checkout
  │     ├── node 20.x
  │     ├── npm ci
  │     ├── npm run typecheck   (tsc --noEmit)
  │     ├── npm run lint        (eslint)
  │     └── npm run build       (next build)
  │
  └── Job: e2e (dépend de: quality)
        ├── npm run dev &
        ├── wait-on http://localhost:3000
        └── npx cypress run --headless
```

### Scripts npm disponibles

```bash
npm run dev          # Serveur de développement (port 3000)
npm run build        # Build de production Next.js
npm run start        # Serveur de production
npm run lint         # ESLint (config next)
npm run typecheck    # TypeScript sans émission (tsc --noEmit)
npm run quality      # lint + typecheck enchaînés
```

### Standards de qualité

- TypeScript strict (pas de `ignoreBuildErrors` en production)
- ESLint config `next` (inclut React, accessibility)
- `dangerouslyAllowSVG: false` sur les images distantes
- Validation côté client des fichiers uploadés (type, taille, extension)

---

## 13. Décisions techniques

| Décision | Alternative rejetée | Justification |
|---|---|---|
| **LocalStorage** pour la persistance | Supabase / Firebase Firestore | Déploiement zéro-infra, données privées locales, pas de compte requis |
| **Next.js App Router** | Pages Router / Vite | Compatibilité Genkit, streaming, meilleure gestion des layouts |
| **ShadCN UI** | MUI / Ant Design | Composants copiés dans le projet, personnalisables, Radix accessible |
| **jsPDF côté client** | Puppeteer / WeasyPrint serveur | Export sans serveur, confidentialité des données |
| **SheetJS côté client** | API Excel serveur | Parsing Excel sans upload, sécurité données |
| **Genkit + Gemini** | OpenAI / LangChain | Intégration Firebase native, Gemini 2.0 Flash gratuit pour proto |
| **Cypress E2E** | Jest + Testing Library | Testent le comportement réel navigateur, pas de mock de DOM |
| **output: standalone** | output par défaut | Requis pour Docker multi-stage (handoff v8) |

---

## 14. Évolutions prévues

### Court terme

- [ ] Mettre à jour les mocks Jest après migration Supabase (cf. handoff section 7)
- [ ] Vérification manuelle de `evaluation-module.tsx` et `student-project-info-form.tsx` (patchés par script)
- [ ] Ajouter `data-testid` sur les éléments clés pour des sélecteurs Cypress plus robustes
- [ ] Activer `ignoreBuildErrors: false` une fois les erreurs TS résolues

### Moyen terme

- [ ] Authentification enseignant (next-auth v5 + Supabase Auth)
- [ ] Synchronisation cloud optionnelle (Supabase PostgreSQL)
- [ ] Dashboard KPI multi-modules (recharts)
- [ ] Mode multi-enseignants avec admin

### Long terme

- [ ] Module IA : génération de commentaires de jury (Genkit/Gemini)
- [ ] Application mobile (PWA ou React Native)
- [ ] Import/export de grilles de critères personnalisées (JSON)
- [ ] Rapport mensuel automatisé (cron + email)

---

*Document généré et maintenu conjointement par M. SADI et GradeAssist AI sessions (mai 2025).*
