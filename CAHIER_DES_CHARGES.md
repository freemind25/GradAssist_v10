
# Cahier des Charges - Application GradeAssist

## 1. Introduction

### 1.1. Objectif de l'application
GradeAssist est une application web conçue pour faciliter et standardiser le processus d'évaluation des travaux d'atelier ou de projets étudiants. Elle permet aux enseignants d'enregistrer les informations relatives aux étudiants et à leurs projets, d'attribuer des notes basées sur des critères prédéfinis, et de générer des fiches d'évaluation individuelles ainsi que des synthèses de notes.

### 1.2. Utilisateurs Cibles
L'application est principalement destinée aux enseignants, évaluateurs et membres de jurys universitaires ou d'établissements d'enseignement supérieur.

## 2. Fonctionnalités Principales

### 2.1. Formulaire d'Évaluation Détaillé
L'application présente un formulaire complet pour saisir toutes les informations nécessaires à une évaluation.

#### 2.1.1. Titre de la Fiche d'Évaluation
*   Un champ de texte permet de personnaliser la partie variable du titre de la fiche d'évaluation (par exemple, "Fiche d'évaluation des travaux de l'atelier **Session Printemps 2024 - Groupe A**").

#### 2.1.2. Informations sur l'Université et l'Établissement
*   **Nom de l'université :** Champ de texte.
*   **Logo de l'université :** Fonctionnalité d'upload d'image (PNG, JPG, SVG, max 2Mo). Le logo est affiché en aperçu et inclus dans les exports PDF.
*   **Nom de l'établissement (Faculté/Institut) :** Champ de texte.
*   **Département :** Champ de texte.

#### 2.1.3. Informations sur les Étudiants
*   **Nom de l'étudiant(e/s) :**
    *   Possibilité d'ajouter jusqu'à 5 étudiants pour les travaux de groupe.
    *   Champs de saisie dynamiques (ajout/suppression).
    *   **Importation depuis Excel (Simulation) :** Un bouton permet de simuler l'upload d'un fichier Excel. Une liste de noms (simulés) extraits du fichier est alors présentée, permettant à l'utilisateur de sélectionner les noms pour les champs étudiants via des menus déroulants.
*   **Intitulé du Projet :** Champ de texte.

#### 2.1.4. Informations sur les Enseignants
*   **Nom de l'enseignant(e/s) :**
    *   Possibilité d'ajouter jusqu'à 3 enseignants.
    *   Champs de saisie dynamiques (ajout/suppression).

#### 2.1.5. Contexte Académique
*   **Niveau d'étude :** Menu déroulant (Licence, Master).
*   **Spécialité du Master :** Champ de texte, visible uniquement si "Master" est sélectionné comme niveau d'étude.
*   **Session (Semestre) :** Menu déroulant dynamique.
    *   Si "Licence" : options S1 à S6.
    *   Si "Master" : options S1 à S3.
    *   Désactivé si le niveau d'étude n'est pas sélectionné.
*   **Année Universitaire :** Champ de texte (ex: 2023-2024).

### 2.2. Grille d'Évaluation
Une grille permet d'évaluer les étudiants sur plusieurs critères.

*   **Critères Prédéfinis :**
    *   Présentation orale (coeff. 4)
    *   Présentation Affichée (coeff. 4)
    *   Esprit de synthèse (coeff. 3)
    *   Innovation (coeff. 3)
    *   Évaluation par les pairs (coeff. 2)
    *   Atteinte des objectifs et respect du contenu (coeff. 2)
    *   Sorties sur terrains (coeff. 1)
    *   Assiduité (Présence /Absence) (coeff. 1)
*   **Attribution des Notes :**
    *   Pour chaque critère, un menu déroulant permet de sélectionner une note numérique.
    *   Les options de notes sont groupées par paliers alphabétiques (A+, A, A-, B+, etc.) correspondant à des fourchettes de pourcentages. Chaque option numérique (ex: 3.6, 3.7) est calculée en fonction du coefficient du critère et du pourcentage du palier.
    *   Option "-- Non Noté --" disponible.
*   **Calcul des Points :**
    *   Les points obtenus pour chaque critère sont calculés et affichés dynamiquement (Note numérique sélectionnée).
*   **Feedback Visuel :**
    *   La couleur de fond du sélecteur de note change en fonction de la note (par exemple, vert pour les notes suffisantes, rouge/orange pour les notes insuffisantes ou nulles).

### 2.3. Résumé de l'Évaluation Actuelle
*   Affiche la **Note Finale** obtenue pour l'évaluation en cours (somme des points de chaque critère).
*   Affiche le **Total Maximum des Points** possible (somme des coefficients de tous les critères).

### 2.4. Gestion des Données et Persistance

#### 2.4.1. Sauvegarde Locale (LocalStorage)
*   **Sauvegarde Automatique du Brouillon :** Les données du formulaire d'évaluation en cours sont automatiquement sauvegardées localement dans le navigateur (LocalStorage) au fur et à mesure des modifications.
*   **Sauvegarde Manuelle du Brouillon :** Un bouton "Sauvegarder Brouillon Actuel" permet à l'utilisateur d'enregistrer explicitement l'état actuel du formulaire.
*   **Stockage de la Synthèse des Évaluations :** Une liste de toutes les évaluations finalisées ("ajoutées à la synthèse") est conservée localement.

#### 2.4.2. Actions sur l'Évaluation
*   **Exporter en CSV / PDF (Évaluation Actuelle) :** Voir section 2.5.
*   **Ajouter à la Synthèse et Réinitialiser :**
    *   Ajoute l'évaluation actuelle (avec toutes ses données et la note finale) à la liste de synthèse stockée localement.
    *   Réinitialise tous les champs du formulaire aux valeurs par défaut pour une nouvelle saisie.
    *   Le brouillon sauvegardé est alors mis à jour avec le formulaire vidé.

### 2.5. Fonctionnalités d'Exportation

#### 2.5.1. Exportation d'une Évaluation Individuelle
*   **Format CSV :** Génère un fichier CSV contenant toutes les informations de l'évaluation (informations générales, détails des critères, notes, points, note finale).
*   **Format PDF :** Génère un fichier PDF professionnel.
    *   Inclut le logo de l'université (si fourni).
    *   Affiche toutes les informations générales saisies.
    *   Présente une grille détaillée des critères avec nom, coefficient, note attribuée et points obtenus.
    *   Affiche la note finale sur le total maximum.
    *   Le titre du document PDF est dynamique et reprend le "complément de titre" saisi par l'utilisateur.

#### 2.5.2. Exportation de la Synthèse des Évaluations
(Visible uniquement si au moins une évaluation a été ajoutée à la synthèse)
*   **Format CSV :** Génère un fichier CSV récapitulant toutes les évaluations stockées.
    *   Colonnes : N°, Nom(s) étudiant(s), Nom(s) enseignant(s), Intitulé du Projet, Niveau d'étude, Spécialité Master, Session, Année Universitaire, Note Finale, Sur (Max Points).
*   **Format PDF :** Génère un document PDF de synthèse.
    *   Inclut les informations générales (Université, Établissement, Département - typiquement celles de la première évaluation, en supposant une cohérence pour le lot).
    *   Le logo de la première évaluation est utilisé s'il est disponible.
    *   Tableau récapitulatif similaire au CSV.

## 3. Interface Utilisateur (UI) et Expérience Utilisateur (UX)

*   **Technologie :** Application monopage (SPA) développée avec Next.js et React.
*   **Style :** Utilisation de Tailwind CSS et des composants ShadCN UI pour une interface moderne et épurée.
*   **Langue :** Interface utilisateur en français.
*   **Responsive Design :** L'application est conçue pour s'adapter aux différentes tailles d'écran (ordinateurs, tablettes).
*   **Notifications :** Des messages (toasts) informent l'utilisateur des actions réussies (sauvegarde, export) ou des erreurs.
*   **Ergonomie :**
    *   Navigation intuitive.
    *   Champs de formulaire clairement libellés.
    *   Éléments dynamiques (ex: apparition du champ "Spécialité Master" conditionnelle).
    *   Feedback visuel pour les actions et les états (ex: coloration des notes).

## 4. Aspects Techniques (Non exhaustif)

*   **Framework Frontend :** Next.js (App Router)
*   **Bibliothèque UI :** React
*   **Langage :** TypeScript
*   **Styling :** Tailwind CSS, CSS Variables (thème ShadCN)
*   **Composants UI :** ShadCN UI
*   **Génération PDF :** jsPDF, jspdf-autotable
*   **Persistance des données :** API Web Storage (LocalStorage du navigateur).
*   **Gestion de l'état :** Hooks React (useState, useEffect, useMemo, useCallback).
*   **Déploiement :** Prévu pour un environnement web statique ou serveur Next.js.
*   **Pas de Backend Spécifique :** L'application fonctionne entièrement côté client pour la gestion des données.

## 5. Évolutions Possibles (Non incluses dans la version actuelle)

*   **Authentification des utilisateurs :** Mise en place d'un système de connexion pour sécuriser l'accès et potentiellement personnaliser l'expérience.
*   **Sauvegarde des données sur un serveur distant / base de données :** Pour permettre la persistance des données au-delà du navigateur local, la synchronisation entre appareils et la collaboration.
*   **Gestion collaborative des évaluations :** Permettre à plusieurs évaluateurs de travailler sur les mêmes fiches ou synthèses, avec gestion des versions ou des droits.
*   **Configuration avancée des critères et des barèmes :** Offrir la possibilité aux utilisateurs de définir leurs propres critères d'évaluation, coefficients, et échelles de notation.
*   **Importation réelle de fichiers Excel (avec une bibliothèque de parsing) :** Remplacer la simulation actuelle par une véritable fonctionnalité d'importation et de traitement des données de fichiers Excel (ex: listes d'étudiants, projets).
*   **Statistiques et visualisations des notes :** Intégrer des outils pour analyser les données d'évaluation, générer des graphiques (distribution des notes, moyennes par critère, etc.) et des rapports statistiques.
*   **Internationalisation (i18n) :** Adapter l'application pour une utilisation en plusieurs langues, en permettant la traduction de l'interface et du contenu.
```