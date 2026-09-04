# 📖 Notice d'Utilisation — GradeAssist

**Guide complet pour les enseignants universitaires**

---

## Table des matières

1. [Installation](#1-installation)
2. [Première connexion](#2-première-connexion)
3. [Créer un module](#3-créer-un-module)
4. [Évaluer des étudiants](#4-évaluer-des-étudiants)
5. [Gérer les présences](#5-gérer-les-présences)
6. [Suivre l'encadrement](#6-suivre-l'encadrement)
7. [Suivre le canevas](#7-suivre-le-canevas)
8. [Consulter le dashboard](#8-consulter-le-dashboard)
9. [Utiliser l'assistant IA](#9-utiliser-l'assistant-ia)
10. [Synchroniser les données](#10-synchroniser-les-données)
11. [Exporter des documents](#11-exporter-des-documents)
12. [Configurer les informations](#12-configurer-les-informations)
13. [Aide et dépannage](#13-aide-et-dépannage)

---

## 1. Installation

### Sur ordinateur (Windows)

1. Téléchargez le fichier `GradeAssist-Setup-X.X.X.exe` depuis [GitHub Releases](https://github.com/freemind25/GradAssist_v10/releases)
2. Double-cliquez sur le fichier téléchargé
3. Si Windows affiche un avertissement, cliquez **"Exécuter quand même"**
4. Suivez l'assistant : **Suivant** → **Installer** → **Terminer**
5. Double-cliquez sur le raccourci **GradeAssist** sur votre Bureau

### Sur téléphone (Android)

**Option 1 — PWA (recommandée) :**
1. Ouvrez **Chrome** sur votre téléphone
2. Allez sur `https://grad-assist-v10.vercel.app`
3. Chrome propose **"Ajouter à l'écran d'accueil"**
4. Cliquez **"Ajouter"**

**Option 2 — APK :**
1. Téléchargez `GradeAssist.apk` depuis [GitHub Releases](https://github.com/freemind25/GradAssist_v10/releases/tag/v2.1.0)
2. Autorisez l'installation : `Paramètres → Sécurité → Sources inconnues`
3. Ouvrez le fichier → **Installer**

### Sur navigateur web

1. Ouvrez votre navigateur (Chrome, Firefox, Edge, Safari)
2. Allez sur `https://grad-assist-v10.vercel.app`
3. L'application est prête à l'emploi !

---

## 2. Première connexion

### 2.1 Identification enseignant

À la première ouverture, le formulaire d'identification s'affiche :

```
┌─────────────────────────────────┐
│   🎓 Identification enseignant  │
│                                 │
│   Nom complet : SADI Messaoud   │
│   Email : m.sadi@univ-...      │
│   Département : Urbanisation   │
│                                 │
│        [ Commencer → ]          │
└─────────────────────────────────┘
```

1. **Nom complet** : Votre nom et prénom
2. **Email** : Votre adresse email universitaire
3. **Département** : Votre département d'affectation

> 💡 Ces informations apparaissent dans le header et les exports PDF.

### 2.2 Interface principale

Après identification, vous accédez à l'interface principale :

```
┌─────────────────────────────────────────────────────┐
│ GradeAssist    [Module] [☁️] [🔄] [M.SADI]          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 📝 Notes │  │ 👥 Prés. │  │ 📖 Enc.  │  ...     │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│              [Contenu principal]                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 3. Créer un module

### 3.1 Créer un nouveau module

1. Cliquez sur **"Nouveau"** dans la barre de menus
2. Saisissez le **nom** du module (ex: "Atelier Projet de Ville 2")
3. Choisissez le **type** :
   - **Atelier** : évaluation par grille de critères pondérés
   - **Standard** : note CC + note examen
4. Cliquez **"Créer"**

### 3.2 Types de modules

| Type | Description | Quand l'utiliser |
|---|---|---|
| **Atelier** | Grille de critères (orale, poster, synthèse...) | Travail de groupe, projet |
| **Standard** | Note CC + Note Examen | Cours magistraux, TD |

### 3.3 Gérer les modules

- **Sélectionner** : Cliquez sur l'onglet du module
- **Supprimer** : Menu → "Supprimer le module" → Confirmer
- **Copier** : Les informations générales se copient automatiquement

---

## 4. Évaluer des étudiants

### 4.1 Mode Atelier

#### Étape 1 : Remplir les informations

Dans l'onglet **"Informations"** :

1. **Nom de l'étudiant(e/s)** : Ajoutez les noms (bouton "+")
2. **Nom de l'enseignant(e/s)** : Votre nom (pré-rempli)
3. **Intitulé du Projet** : Titre du projet
4. **Niveau d'étude** : Licence (L1/L2/L3) ou Master (M1/M2/M3)
5. **Session** : Normale / Rattrapage
6. **Année universitaire** : Ex: 2025-2026

> 💡 Vous pouvez importer les noms depuis un fichier Excel !

#### Étape 2 : Attribuer les notes

Dans l'onglet **"Grille d'évaluation"** :

```
┌─────────────────┬──────┬──────┬──────┬──────┐
│ Critère         │ Coeff│ A+   │ A    │ B+   │ ...
├─────────────────┼──────┼──────┼──────┼──────┤
│ Présentation    │  4   │      │  ✓   │      │
│ poster          │      │      │      │      │
├─────────────────┼──────┼──────┼──────┼──────┤
│ Synthèse        │  3   │  ✓   │      │      │
└─────────────────┴──────┴──────┴──────┴──────┘
              Total : 14.56 / 20  (72.8%)
```

1. **Cliquez** sur une cellule pour attribuer la note
2. Le **total** se met à jour automatiquement
3. La **couleur** change selon le niveau (vert = bien, rouge = à revoir)

#### Étape 3 : Vérifier la mention

La mention s'affiche automatiquement :

| Note /20 | Mention |
|---|---|
| 16-20 | Très Bien |
| 14-15.99 | Bien |
| 12-13.99 | Assez Bien |
| 10-11.99 | Passable |
| 0-9.99 | Ajourné |

### 4.2 Mode Standard

Dans l'onglet **"Évaluation"** :

1. **Note CC** : Saisissez la note de contrôle continu (0-20)
2. **Note Examen** : Saisissez la note d'examen (0-20)
3. **Coefficient CC** : Ajustez le slider (30-70%)
4. La **note finale** se calcule automatiquement :
   ```
   Note = (CC × poids) + (Examen × (1 - poids))
   ```

---

## 5. Gérer les présences

### 5.1 Marquer les présences

Dans l'onglet **"Présences"** :

1. **Sélectionnez la date** : Cliquez sur le calendrier
2. **Cliquez** sur le statut de chaque étudiant pour faire défiler :
   - **P** (Présent) → Vert
   - **A** (Absent) → Rouge
   - **R** (Retard) → Orange
   - **E** (Excusé) → Gris

### 5.2 Consulter les statistiques

Les statistiques s'affichent automatiquement :

```
📊 Statistiques
├── Nombre de séances : 12
├── Taux moyen de présence : 87%
├── Étudiants à risque (< 75%) : 2
└── Meilleure assiduité : 100%
```

### 5.3 Alertes présence

GradeAssist alerte automatiquement les étudiants avec un taux de présence inférieur à 75%.

### 5.4 Exporter le registre

1. Cliquez **"📄 PDF"** pour télécharger le registre mensuel
2. Cliquez **"📊 CSV"** pour exporter les données brutes

---

## 6. Suivre l'encadrement

### 6.1 Ajouter un étudiant encadré

Dans l'onglet **"Encadrement"** :

1. Cliquez **"+ Ajouter un étudiant"**
2. Remplissez :
   - **Nom** : Nom de l'étudiant
   - **Titre du mémoire** : Sujet de recherche
   - **Directeur** : Nom du directeur
   - **Date de début** : Début de l'encadrement
   - **Date de soutenance prévue** : Date cible

### 6.2 Gérer les événements

Pour chaque étudiant, ajoutez des événements :

| Type d'événement | Description |
|---|---|
| 📋 Consultation | Rendez-vous de suivi |
| 📄 Dépôt | Remise du mémoire |
| ✏️ Révision | Corrections demandées |
| 🎤 Soutenance | Soutenance finale |
| 📞 Communication | Email ou appel |
| 📝 Autre | Événement divers |

### 6.3 Suivre la progression

- **Barre de progression** : Avancement 0-100%
- **Statut** : En cours / En rédaction / Soutenu / Abandonné
- **Agenda global** : Tous les événements triés par date

---

## 7. Suivre le canevas

### 7.1 Importer le canevas

Dans l'onglet **"Canevas"** :

1. Cliquez **"📄 Importer un PDF"**
2. Sélectionnez le fichier PDF du canevas officiel
3. Le canevas s'affiche dans l'interface

### 7.2 Gérer les chapitres

Pour chaque chapitre :

1. Cliquez **"+ Ajouter un chapitre"**
2. Saisissez le **nom** du chapitre
3. Définissez les **dates** (début/fin prévues)
4. **Cliquez** sur le statut pour faire défiler :
   - ⬜ Non commencé
   - 🟡 En cours
   - ✅ Terminé

### 7.3 Organiser

- **Sous-chapitres** : Hiérarchie imbriquée
- **Recherche** : Trouvez rapidement un chapitre
- **Filtres** : Par statut (tous, en cours, terminés)

---

## 8. Consulter le dashboard

Dans l'onglet **"Dashboard"** :

### 8.1 Statistiques rapides

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Moyenne  │ │ Médiane  │ │ Écart-   │ │ Taux     │
│ 14.2/20  │ │ 15.0/20  │ │ type 3.1 │ │ Prés.87% │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 8.2 Graphiques

- **Distribution des notes** : Histogramme des notes
- **Taux de présence** : Diagramme circulaire
- **Notes par critère** : Barres comparatives
- **Profil compétences** : Graphique radar
- **Répartition mentions** : Camembert

### 8.3 Alertes

- Étudiants avec taux de présence < 75%
- Notes en dessous de la moyenne
- Étudiants en danger d'ajournement

---

## 9. Utiliser l'assistant IA

### 9.1 Activer l'assistant

1. Ouvrez le panneau **"🤖 Assistant IA"**
2. Si ce n'est pas fait, configurez votre **clé API Mistral AI** :
   - Allez sur [console.mistral.ai](https://console.mistral.ai)
   - Créez un compte gratuit
   - Menu → "API Keys" → "Create new key"
   - Copiez la clé et collez-la dans les paramètres

### 9.2 Actions rapides

Cliquez sur l'une des 15 actions prédéfinies :

| Catégorie | Action | Description |
|---|---|---|
| **Évaluation** | 💬 Commentaires | Générer des commentaires personnalisés |
| | 📋 Barème | Créer un barème d'évaluation |
| | 🔄 Alternatives | Proposer des méthodes d'évaluation |
| | ❓ Quiz | Générer des questions de révision |
| **Analyse** | 👥 Présences | Analyser les données de présence |
| | ⚠️ À risque | Identifier les étudiants en difficulté |
| | 📈 Tendances | Analyser l'évolution des notes |
| | 📊 Comparative | Comparer les performances |
| **Pédagogie** | 📖 Synthèse | Résumer l'encadrement |
| | 🎯 Activités | Proposer des activités pédagogiques |
| | 📝 Jury | Préparer le rapport de jury |
| **Rapports** | 📅 Mensuel | Générer un rapport mensuel |
| | 📋 Planning | Aider à planifier les cours |
| | ✉️ Email | Rédiger un email administratif |

### 9.3 Chat libre

Posez n'importe quelle question sur vos données d'évaluation. L'assistant comprend le contexte universitaire algérien.

---

## 10. Synchroniser les données

### 10.1 Sauvegarde automatique

GradeAssist sauvegarde automatiquement vos données dans le navigateur (localStorage).

> ⚠️ **Important** : Cette sauvegarde est locale. Si vous videz le cache du navigateur, les données seront perdues.

### 10.2 Google Drive

1. Cliquez sur le bouton **Google** dans le header
2. Autorisez l'accès à Google Drive
3. Cliquez **"☁️"** pour sauvegarder
4. Cliquez **"⬇️"** pour charger

### 10.3 Nextcloud

1. Cliquez sur le bouton **"☁️ Nextcloud"** dans le header
2. Remplissez :
   - **URL** : `https://cloud.votre-universite.dz`
   - **Utilisateur** : votre identifiant
   - **Mot de passe** : mot de passe d'application
3. Cliquez **"Se connecter"**
4. Utilisez les boutons :
   - **⬆️ Sauvegarder** : Envoie les données
   - **⬇️ Charger** : Récupère les données
   - **📦 Backups** : Gère les sauvegardes

> 💡 **Conseil** : Utilisez un **mot de passe d'application** (Paramètres → Sécurité → Ajouter un mot de passe d'application).

---

## 11. Exporter des documents

### 11.1 Fiche d'évaluation individuelle

1. Ouvrez le module concerné
2. Cliquez **"📄 Fiche PDF"**
3. Le PDF se télécharge avec :
   - En-tête institutionnel
   - Logo université
   - Grille des critères
   - Note finale et mention

### 11.2 PV des notes

1. Cliquez **"📋 PV des Notes"**
2. Le PV au format officiel se génère avec :
   - En-tête universitaire
   - Tableau des notes par étudiant
   - Notes CC et note finale

### 11.3 Synthèse des évaluations

1. Cliquez **"📊 Synthèse PDF"** ou **"📊 Synthèse CSV"**
2. Le document contient :
   - Toutes les évaluations du module
   - Notes finales et mentions
   - Classement

### 11.4 Registre de présences

1. Ouvrez l'onglet **"Présences"**
2. Cliquez **"📄 PDF"** ou **"📊 CSV"**
3. Le registre mensuel se télécharge

---

## 12. Configurer les informations

### 12.1 Informations générales

Dans l'onglet **"Informations"** du module :

| Champ | Description |
|---|---|
| Université | Nom de votre université |
| Établissement | Nom de la faculté |
| Département | Votre département |
| Niveau d'étude | Licence / Master |
| Spécialité Master | Si applicable |
| Session | Normale / Rattrapage |
| Année universitaire | Ex: 2025-2026 |

### 12.2 Logo université

1. Cliquez sur **"📷 Logo"**
2. Sélectionnez un fichier PNG, JPG ou SVG
3. Le logo apparaît sur tous les exports PDF

### 12.3 Informations enseignant

Les informations de votre profil (nom, email, département) sont pré-remplies et apparaissent dans les exports.

---

## 13. Aide et dépannage

### 13.1 Questions fréquentes

**Q : Mes données ont disparu !**
> Vérifiez que vous n'avez pas vidé le cache du navigateur. Configurez Google Drive ou Nextcloud pour une sauvegarde cloud.

**Q : L'assistant IA ne fonctionne pas !**
> Vérifiez que vous avez configuré votre clé API Mistral AI dans les paramètres.

**Q : Le PDF est mal formaté !**
> Vérifiez que le logo université est au bon format (PNG/JPG, max 2 MB).

**Q : Comment exporter plusieurs modules ?**
> Utilisez l'export "Synthèse" qui inclut toutes les évaluations du module actif.

### 13.2 Support

- **Documentation** : Cliquez sur le bouton **"❓ Aide"** dans l'application
- **GitHub** : [https://github.com/freemind25/GradAssist_v10](https://github.com/freemind25/GradAssist_v10)
- **Email** : m.sadi@univ-constantine3.dz

### 13.3 Raccourcis clavier

| Raccourci | Action |
|---|---|
| `Ctrl + N` | Nouveau module |
| `Ctrl + S` | Sauvegarder |
| `Ctrl + E` | Exporter PDF |
| `Tab` | Naviguer entre les onglets |
| `Entrée` | Valider une saisie |

---

## Aperçu visuel de l'application

### Header
```
┌─────────────────────────────────────────────────────────────┐
│ 🎓 GradeAssist  │ [Module ▾] │ [☁️ Drive] │ [☁️ NC] │ 👤 M.SADI │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar
```
┌──────────┐
│ 📝 Notes │ ← Grille d'évaluation
│ 👥 Prés. │ ← Registre de présences
│ 📖 Enc.  │ ← Encadrement mémoires
│ 🗺️ Canev.│ ← Suivi du cours
│ 📊 Dash. │ ← Statistiques
│ ⚠️ Alerte│ ← Étudiants à risque
│ 📚 Tutor.│ ← Suivi de tutorat
│ 🤖 IA    │ ← Assistant intelligent
└──────────┘
```

---

## Conseils pour un usage optimal

1. **Sauvegardez régulièrement** via Google Drive ou Nextcloud
2. **Utilisez les templates** de l'assistant IA pour gagner du temps
3. **Importez les noms** depuis Excel plutôt que de les saisir manuellement
4. **Configurez le logo** université pour des exports professionnels
5. **Consultez le dashboard** pour identifier les étudiants en difficulté
6. **Utilisez la PWA** sur votre téléphone pour un accès rapide

---

*Notice d'utilisation — GradeAssist v2.2.0*
*© 2026 — Université de Constantine 3*
*Département de Gestion des Villes et de l'Urbanisation*
