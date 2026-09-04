# 🎓 GradeAssist — Note de Présentation

**Application de gestion pédagogique universitaire — Évaluation, Présences, Encadrement, Tutorat & Assistant IA**

---

## 1. Contexte et Problématique

Dans le cadre de l'enseignement supérieur en Algérie, les enseignants sont confrontés à des défis quotidiens dans la gestion des évaluations :

- **Volume important** de copies à évaluer (parfois 200+ étudiants par module)
- **Diversité des formats** d'évaluation (atelier, matière standard, encadrement de mémoires)
- **Exigences administratives** : PV au format officiel, registres de présences, rapports de jury
- **Manque d'outils adaptés** au système universitaire algérien (notes /20, mentions, sessions)
- **Risque de perte de données** avec les méthodes manuelles (cahiers, feuilles Excel)

**GradeAssist** répond à ces besoins en proposant une solution numérique complète, ergonomique et conforme aux standards universitaires algériens.

---

## 2. Présentation de la Solution

GradeAssist est une application **tout-en-un** qui centralise :

| Module | Fonctionnalité |
|---|---|
| 📝 **Évaluation** | Grille de critères pondérés (Atelier) ou Note CC + Examen (Standard) |
| 👥 **Présences** | Registre complet avec statistiques et alertes |
| 📖 **Encadrement** | Suivi des mémoires et thèses |
| 📚 **Tutorat** | Suivi des séances de cours, TD, TP et rattrapage |
| 🗺️ **Canevas** | Import PDF et suivi des chapitres de cours |
| 📊 **Dashboard** | Statistiques et graphiques d'analyse |
| ⚠️ **Alertes** | Détection des étudiants à risque |
| 🤖 **Assistant IA** | 15 actions rapides avec Mistral AI |
| ☁️ **Synchronisation** | Google Drive + Nextcloud (WebDAV) |
| 📱 **Mobile** | PWA installable + APK Android |

---

## 3. Caractéristiques Techniques

### 3.1 Architecture

| Composant | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript 5.x |
| Interface | React 19 + ShadCN UI |
| Styles | Tailwind CSS 3.x |
| Graphiques | Recharts 2.15 |
| PDF | jsPDF + autoTable |
| Excel | SheetJS (xlsx) |
| IA | Mistral AI (via API) |
| Mobile | Capacitor (APK) + PWA |
| Desktop | Electron (Windows) |

### 3.2 Déploiement

| Plateforme | Statut |
|---|---|
| 🌐 Web | [grad-assist-v10.vercel.app](https://grad-assist-v10.vercel.app) |
| 📱 Android | APK disponible sur GitHub Releases |
| 🖥️ Windows | Installeur .exe disponible sur GitHub Releases |
| 💻 Développement | Sandbox Freebuff (Next.js dev server) |

---

## 4. Fonctionnalités Détaillées

### 4.1 Module d'Évaluation

#### Mode Atelier
- **Grille d'évaluation** : 8 critères prédéfinis avec coefficients (somme = 20)
- **11 niveaux de notation** : de A+ (90-100%) à F (0-39%)
- **Calcul automatique** : points par critère, total, pourcentage, mention
- **Critères personnalisés** : ajout/suppression de critères
- **Notes CC pré-remplies** : pour les évaluations continuelles

#### Mode Standard
- **Note CC** (0-20) + **Note Examen** (0-20)
- **Coefficient CC** ajustable (30-70%)
- **Calcul automatique** : note finale pondérée
- **Mention** correspondante (Très Bien, Bien, Passable, Ajourné)

### 4.2 Gestion des Présences

- **Sélecteur de date** avec calendrier interactif
- **Tableau étudiant × séance** avec statuts : Présent / Absent / Retard / Excusé
- **Statistiques** : taux de présence, nombre de séances
- **Alertes** : étudiants avec taux < 75%
- **Export PDF** : registre mensuel au format officiel
- **Export CSV** : pour traitement dans Excel

### 4.3 Encadrement de Mémoires

- **Suivi individuel** : titre, directeur, dates, statut
- **6 types d'événements** : consultation, dépôt, révision, soutenance, etc.
- **Barre de progression** : avancement 0-100%
- **Agenda global** : tous les événements triés par date
- **Messages email** : 4 modèles pré-remplis via mailto:

### 4.4 Tutorat

- **Séances de tutorat** : date, heure, durée, sujet, objectifs
- **7 types de séance** : Cours, TD, TP, Rattrapage, Prép. Examen, Méthode, Autre
- **Suivi par étudiant** : nombre de séances, progression, notes
- **Filtres** : par étudiant et par type de séance
- **Statistiques** : heures totales, note moyenne, taux de complétion
- **Note de séance** : système d'étoiles 1-5
- **Progression** : barre de progression 0-100%

### 4.5 Canevas du Cours

- **Import PDF** du canevas officiel
- **Suivi des chapitres** : Non commencé → En cours → Terminé
- **Sous-chapitres** hiérarchiques
- **Planning prévisionnel** avec dates début/fin
- **Recherche** de chapitres

### 4.6 Dashboard Analytics

- **Statistiques rapides** : moyenne, médiane, écart-type
- **Distribution des notes** : histogramme
- **Taux de présence** : pie chart
- **Notes par critère** : barres comparatives
- **Profil compétences** : radar chart
- **Répartition des mentions**
- **Classement** des évaluations
- **Alertes** : étudiants à risque

### 4.7 Assistant IA (Mistral AI)

**15 actions rapides** organisées par catégorie :

| Catégorie | Actions |
|---|---|
| **Évaluation** | Commentaires, Barème, Évaluations alternatives, Quiz |
| **Analyse** | Présences, Étudiants à risque, Tendances, Comparative |
| **Pédagogie** | Synthèse encadrement, Activités, Résumé jury |
| **Rapports** | Rapport mensuel, Planning, Email |

### 4.8 Synchronisation Cloud

#### Google Drive
- Connexion OAuth2 sécurisée
- Sauvegarde/chargement en un clic
- Dossier GradeAssist automatique

#### Nextcloud (WebDAV)
- **Protocol WebDAV** standard
- **Mot de passe d'application** (sécurité renforcée)
- **Backups horodatés** à chaque sauvegarde
- **Restauration** de backups spécifiques
- **Données souveraines** (hébergement local)

### 4.9 Exports

| Format | Contenu | Usage |
|---|---|---|
| **PDF individuel** | Fiche d'évaluation complète | Remise à l'étudiant |
| **PDF synthèse** | Tableau de toutes les évaluations | Délibération jury |
| **PDF PV** | Procès-verbal au format officiel | Administration |
| **PDF registre** | Registre de présences mensuel | Contrôle |
| **CSV** | Données tabulaires | Traitement Excel |
| **Excel** | Workbook complet | Archivage |

---

## 5. Avantages Compétitifs

| Critère | GradeAssist | Méthode manuelle | Autres outils |
|---|---|---|---|
| **Adapté au système algérien** | ✅ Notes /20, mentions, sessions | ✅ | ❌ |
| **Calcul automatique** | ✅ Temps réel | ❌ | ⚠️ |
| **Exports PDF officiels** | ✅ Format universitaire | ⚠️ Manuels | ⚠️ |
| **Multi-modules** | ✅ Illimité | ❌ | ⚠️ |
| **Synchronisation cloud** | ✅ Drive + Nextcloud | ❌ | ⚠️ |
| **Mobile** | ✅ PWA + APK | ❌ | ❌ |
| **Assistant IA** | ✅ 15 actions | ❌ | ❌ |
| **Hors ligne** | ✅ 100% | ✅ | ❌ |
| **Gratuit** | ✅ | ✅ | ❌ |
| **Souveraineté données** | ✅ + Nextcloud | ✅ | ❌ |

---

## 6. Sécurité et Confidentialité

- **100% hors ligne** : aucune donnée envoyée à un serveur tiers
- **Pas de compte requis** : aucune inscription, aucune connexion
- **Clé API Mistral** : stockée localement (localStorage), jamais partagée
- **Nextcloud** : mot de passe d'application (pas le mot de passe principal)
- **Exports côté client** : PDF, CSV, Excel générés dans le navigateur

---

## 7. Accessibilité

### Plateformes supportées

| Plateforme | Méthode d'accès |
|---|---|
| 🌐 Navigateur web | [grad-assist-v10.vercel.app](https://grad-assist-v10.vercel.app) |
| 📱 Android | APK (Release GitHub) ou PWA (Chrome → Ajouter à l'écran) |
| 🪟 Windows | Installeur .exe (Release GitHub) |
| 🍎 macOS | Via le navigateur web (PWA) |
| 🐧 Linux | Via le navigateur web (PWA) |

### Installation mobile (PWA)

1. Ouvrir Chrome sur Android
2. Naviguer vers l'URL de l'application
3. Chrome propose "Ajouter à l'écran d'accueil"
4. Cliquer "Ajouter" → l'app apparaît comme une icône native

### Installation Windows

1. Télécharger `GradeAssist-Setup-X.X.X.exe` depuis GitHub Releases
2. Exécuter le fichier
3. Suivre l'assistant d'installation
4. Double-cliquer sur le raccourci Bureau

---

## 8. Plan de Déploiement

### Phase 1 — Démonstration
- [x] Application fonctionnelle en mode développement
- [x] Déploiement sur Vercel (URL permanente)
- [x] APK Android disponible
- [x] Installeur Windows disponible

### Phase 2 — Utilisation pilote
- [ ] Configuration Nextcloud institutionnel
- [ ] Formation des enseignants (10-15 min)
- [ ] Collecte des retours
- [ ] Ajustements

### Phase 3 — Déploiement large
- [ ] Installation sur les postes de l'université
- [ ] Distribution de l'APK aux enseignants
- [ ] Support technique

---

## 9. Résumé

**GradeAssist** est une solution complète, moderne et adaptée au contexte universitaire algérien pour :

✅ **Évaluer** les étudiants (atelier, matière, encadrement)
✅ **Suivre** les présences et les progrès
✅ **Tutorer** et suivre les séances pédagogiques
✅ **Analyser** les performances (dashboard, alertes)
✅ **Exporter** des documents officiels (PDF, CSV, Excel)
✅ **Synchroniser** les données (Google Drive, Nextcloud)
✅ **Utiliser** sur tous les appareils (web, mobile, desktop)

> *Application développée par M. SADI — Université de Constantine 3*
> *Département de Gestion des Villes et de l'Urbanisation*

---

*Document généré le 4 septembre 2026*
*Version : 2.2.0*
