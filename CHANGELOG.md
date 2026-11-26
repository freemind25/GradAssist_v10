# Journal des modifications

Toutes les dates sont au format JJ/MM/AAAA.

## Non publié — filet de sécurité sur les données (26/11/2026)

Les données pédagogiques ne quittent pas l'appareil : le `localStorage` n'est
pas une sauvegarde. Ce lot rend cet écart visible, et réversible.

### Sauvegarde

- **Bandeau de rappel** (`src/components/backup-reminder.tsx`) : apparaît dès
  qu'aucune sauvegarde n'a été téléchargée, puis au-delà de 7 jours sans
  export. Export direct depuis le bandeau, masquable pour la session.
- **Suivi de la dernière sauvegarde** (`src/lib/backup-service.ts`) : la date
  du dernier export est mémorisée et affichée en pied de page, à côté du volume
  de données.
- **Copie de sécurité automatique** avant toute restauration de fichier ou
  migration de version : l'état précédent reste restaurable depuis le bandeau,
  via le même dialogue de confirmation que l'import. La copie ne contient pas
  les PDF de canevas ni les logos, volumineux et déjà couverts par l'export
  manuel, afin de ne pas consommer le quota du navigateur.

### Robustesse

- **`src/app/error.tsx` et `src/app/global-error.tsx`** : une exception de rendu
  affiche un écran explicatif avec « Réessayer » (ou « Recharger
  l'application »), au lieu d'une page blanche. Aucune donnée locale n'est
  touchée par ce chemin.

## Non publié — chantier « audit P0 » (22/11/2026)

Série de corrections issues de l'audit de sécurité et de fiabilité. L'objectif
de ce lot est de rendre l'application sûre à diffuser : plus de secret dans le
dépôt, plus de route API ouverte, plus de perte de données silencieuse.

### Sécurité

- **Clé API Mistral retirée du dépôt.** `SESSION_MEMORY.md` contenait deux clés
  réelles en clair ; le fichier est supprimé du suivi et ignoré par git. La clé
  doit être révoquée (voir `SECURITY.md`).
- **Keystore Android retiré du dépôt.** `android/app/gradeassist-release.keystore`
  et les mots de passe en clair de `android/app/build.gradle` sont remplacés par
  deux sources : `android/keystore.properties` (local, ignoré) ou les variables
  `ANDROID_KEYSTORE_*` (secrets GitHub). `assembleRelease` échoue explicitement
  si la signature est absente, au lieu de produire un APK non signé.
- **`push_to_github.sh` réécrit** : plus aucun jeton passé en argument de
  commande (il restait dans l'historique du shell).
- **Routes API protégées** : contrôle d'origine, quota par adresse IP et plafond
  de taille sur `/api/ai` et `/api/mistral` ; limitation des tentatives de
  connexion (10 / 15 min) et d'inscription (5 / h) sur `/api/auth`.
- **Politique de confidentialité corrigée** : le stockage des jetons Drive et de
  la clé IA est décrit tel qu'il est (stockage local de l'appareil, non
  chiffré), et le transfert du contexte pédagogique aux fournisseurs d'IA est
  désormais mentionné. Une note éditoriale oubliée, qui exposait une adresse
  personnelle, a été supprimée de la page publique.

### Fiabilité des données

- **Sauvegarde et restauration** (menu Fichier) : export JSON de tous les
  modules, réimport avec choix entre remplacement et ajout, validation du
  fichier et complétion des champs manquants.
- **Alerte de quota** : un échec d'écriture dans le stockage local n'est plus
  seulement journalisé en console ; un bandeau explique la situation et renvoie
  vers la sauvegarde. Le pied de page affiche l'espace occupé.
- **Inscription** : l'utilisateur est connecté directement après la création de
  son compte (la route posait déjà le cookie de session).

### Documentation

- `SECURITY.md` : règles de gestion des secrets, procédure de signature Android,
  marche à suivre après exposition, purge de l'historique.
- `scripts/purge-secrets-history.sh` : purge assistée des fichiers sensibles de
  l'historique git (à exécuter par le propriétaire, avec sauvegarde préalable).
- Guide intégré : les sections « Synchronisation Cloud » et « export Excel »,
  qui décrivaient des fonctionnalités inexistantes, sont remplacées par la
  sauvegarde par fichier.

### Reste à faire (actions du propriétaire)

1. Révoquer la clé Mistral et l'ancien jeton GitHub.
2. Décider du sort du keystore exposé (conservation avec rotation planifiée, ou
   nouvelle signature).
3. Créer les quatre secrets Android dans GitHub Actions.
4. Exécuter `scripts/purge-secrets-history.sh`, puis `git push --force`.
5. Faire relire la politique de confidentialité modifiée.
