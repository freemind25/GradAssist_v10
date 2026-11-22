# GradeAssist

Application de gestion pédagogique universitaire : évaluation par critères, notes CC/Examen, registre de présences, encadrement de mémoires, canevas de cours, tutorat, rapports et assistant IA.

> Ce document décrit la version **2.9.12** telle qu'elle est réellement implémentée. Les versions précédentes de ce README décrivaient une application obsolète (localStorage seul, deux types de modules, Genkit) — voir `CHANGELOG.md`.

---

## 1. Ce que fait l'application

Un **module** représente une matière, un atelier ou un MOOC. Chaque module possède ses propres données, organisées en onglets.

| Onglet | Contenu | Types concernés |
|---|---|---|
| Informations | université, logo, département, niveau, session, étudiants, enseignants | tous |
| Évaluation | grille de critères pondérés, notes A+ → F | atelier |
| Matière classique | note CC + note d'examen, pondération réglable | standard, MOOC |
| Présences | registre date × étudiant (Présent / Absent / Retard / Excusé) | tous |
| Encadrement | fiches de mémoires, avancement, agenda | tous |
| Canevas | PDF officiel + arborescence de chapitres | tous |
| Tutorat | séances, objectifs, progression, notes | tous |
| Groupes | groupes de travail colorés | tous |
| Notes rapides | observations par étudiant | tous |
| Tableau de bord | moyenne, médiane, écart-type, distribution, mentions | tous |
| Rapports | synthèses texte, envoi Google Drive | tous |
| Assistant IA | chat contextuel, 7 fournisseurs au choix | tous |

**Exports** : fiche individuelle PDF et CSV, synthèse PDF et CSV, PV de notes, registre de présences PDF et CSV, rapports texte.

---

## 2. Où vivent les données

**Tout est stocké sur l'appareil**, dans le navigateur ou la WebView :

| Donnée | Emplacement |
|---|---|
| Modules, notes, présences, encadrement, canevas, tutorat | `localStorage["gradeAssist_modules"]` |
| PDF du canevas | IndexedDB (`GradeAssist_Syllabus`), une entrée par module |
| Profil de l'enseignant (mode invité) | `localStorage["gradeAssist_teacher"]` |
| Clé API du fournisseur IA | `localStorage` — en clair |
| Jeton Google Drive | `localStorage` — en clair |

Il n'existe **aucune synchronisation entre appareils**. Le schéma PostgreSQL de `src/lib/db.ts` n'est utilisé que pour la table `users` (authentification) ; les tables de données pédagogiques sont créées mais jamais alimentées.

**Sauvegarde** : menu *Fichier → Sauvegarder mes données (JSON)*, puis *Restaurer une sauvegarde…*. C'est le seul moyen de transférer les données d'un appareil à l'autre, et la seule protection contre la perte du stockage local.

---

## 3. Comment l'application est distribuée

| Canal | Réalité |
|---|---|
| **Web** | Next.js 15 déployé sur Vercel — l'application de référence |
| **Windows** | Electron qui **charge l'URL Vercel** dans une fenêtre ; ne fonctionne pas hors connexion |
| **Android** | Capacitor : une WebView qui **charge la même URL** ; l'APK ne contient pas l'application, seulement la coquille |

Conséquence pratique : une correction du code web est active dès le déploiement Vercel, sans reconstruire les applications Windows et Android. En revanche, les plugins natifs (enregistrement de fichiers) nécessitent, eux, une reconstruction.

---

## 4. Pile technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15.2.8 (App Router, `output: standalone`) |
| Langage | TypeScript 5, `strict: true` |
| UI | ShadCN/Radix + Tailwind CSS |
| PDF | jsPDF + jspdf-autotable |
| Excel | SheetJS (`xlsx`) — import uniquement |
| Base | Neon PostgreSQL (comptes uniquement) |
| Auth | bcrypt + JWT HS256 en cookie `httpOnly` |
| IA | Proxy BYOK vers RoutesMe, Groq, OpenRouter, Gemini, OpenAI, Mistral, CodeCraft |
| Desktop | Electron 33 |
| Mobile | Capacitor 8 + `@capacitor/filesystem`, `@capacitor/share` |

---

## 5. Démarrage

```bash
npm ci                    # installe le lockfile (Node 20 recommandé)
cp .env.example .env.local  # puis renseigner les variables
npm run dev               # http://localhost:3000
```

Variables indispensables pour l'authentification : `DATABASE_URL`, `JWT_SECRET`. Sans elles, l'application reste utilisable en **mode invité** (données locales uniquement).

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` / `npm start` | build et serveur de production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run quality` | lint + typecheck |
| `npm run electron:build` | installeur Windows |
| `npx cap sync android` | synchronise les plugins Android |

---

## 6. Tests

La suite Cypress (`cypress/e2e/`, 8 fichiers) **n'est pas exploitable en l'état** : elle date de juin, décrit une interface qui a changé, contient des appels à `.or()` qui n'existe pas dans l'API Cypress, et n'est exécutée par aucun workflow. Un plan de remise en état est décrit dans le rapport d'audit.

Ce qui est réellement vérifié en intégration continue : `tsc --noEmit`, ESLint et `next build`.

---

## 7. Sécurité

Voir [`SECURITY.md`](./SECURITY.md) : gestion des secrets, signature Android, procédure de purge d'historique.

Points à connaître :

- l'application fonctionne sans compte (mode invité) ; l'authentification ne protège pas les données locales ;
- `/api/ai` est protégée par contrôle d'origine et quota par IP, pas par session ; `REQUIRE_AUTH_FOR_AI=1` permet d'exiger une session ;
- l'assistant IA envoie le contexte du module (noms, notes, absences) au fournisseur choisi ;
- les jetons et clés stockés dans `localStorage` ne sont pas chiffrés.

---

## 8. Limites connues

- Pas de synchronisation multi-appareils, pas de partage entre enseignants.
- Le PV de notes ne contient pas les notes : aucun résultat par étudiant n'est modélisé (seul l'étudiant affiché a une note).
- Le texte arabe du PV n'est pas rendu (police jsPDF sans glyphes arabes).
- Les modules « Matière classique » et « MOOC » n'ont pas d'export PDF/CSV.
- La détection des étudiants à risque n'applique pas le seuil de note annoncé.

---

## 9. Documentation

| Document | Contenu |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | architecture réelle, flux, modèle de données, dette |
| [`SECURITY.md`](./SECURITY.md) | secrets, signature, purge d'historique |
| [`CHANGELOG.md`](./CHANGELOG.md) | journal des modifications |
| [`CAHIER_DES_CHARGES.md`](./CAHIER_DES_CHARGES.md) | expression du besoin initial |

---

*Conçu par M. SADI — © 2025 GradeAssist.*
