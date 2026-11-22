# Sécurité — GradeAssist

Ce document décrit les règles de gestion des secrets, la procédure de signature
Android et la marche à suivre en cas de fuite. Il fait suite à l'audit de
sécurité d'octobre 2026.

---

## 1. Règles permanentes

| Règle | Détail |
|---|---|
| **Aucun secret dans le dépôt** | Clés API, mots de passe, jetons et keystores vivent dans `.env.local` (local) ou dans les *secrets* GitHub (CI). |
| **Aucun secret en argument de commande** | Les arguments restent visibles dans l'historique du shell et dans la liste des processus. Utiliser une variable d'environnement ou `gh auth login`. |
| **Aucun journal d'assistant versionné** | `SESSION_MEMORY.md` et assimilés sont ignorés par git : ils contiennent des extraits de commandes, parfois des clés. |
| **Portée minimale des jetons** | Un jeton GitHub doit être *fine-grained*, limité à ce dépôt, avec les seuls droits `Contents: read/write`. |
| **Rotation après exposition** | Tout secret ayant circulé en clair (dépôt, ticket, capture, chat) est considéré comme compromis et doit être révoqué. |

Fichiers ignorés par git, à ne jamais forcer avec `git add -f` :

```
.env  .env.local  .env.*.local
*.keystore  *.jks  android/keystore.properties
SESSION_MEMORY.md
```

---

## 2. Incident connu : clés exposées dans l'historique

| Secret | Où | État |
|---|---|---|
| Clé API Mistral (32 caractères) | `SESSION_MEMORY.md` (anciennes lignes 35 et 116) | **Fichier retiré du suivi.** La clé reste dans l'historique git : **à révoquer** sur https://console.mistral.ai |
| Keystore de signature Android + mots de passe | `android/app/build.gradle` et `android/app/gradeassist-release.keystore` | **Retirés du suivi.** Le fichier est désormais fourni par les secrets CI. Le keystore exposé reste utilisable par un tiers : voir §3. |
| Jeton GitHub passé en argument | `push_to_github.sh` | Script réécrit : plus aucun jeton en argument. Révoquer tout ancien jeton. |

### Actions à effectuer par le propriétaire du dépôt

1. **Révoquer la clé Mistral** et en générer une nouvelle.
2. **Révoquer l'ancien jeton GitHub** (Settings → Developer settings → Tokens).
3. **Décider du sort du keystore Android** :
   - *Option recommandée* — conserver l'ancien keystore (la signature des APK déjà
     installés doit rester identique) mais le considérer comme un secret à
     rotation planifiée, et **ne plus jamais** le versionner ;
   - *Option rupture* — générer un nouveau keystore, publier l'APK sous un nouvel
     `applicationId` (ou informer les utilisateurs d'une désinstallation), car
     Android refuse une mise à jour signée par une autre clé.
4. **Purger l'historique** avec `scripts/purge-secrets-history.sh` (voir §4),
   puis forcer la mise à jour du dépôt distant.

---

## 3. Signature Android

Le keystore n'est plus versionné. Deux sources, dans cet ordre :

### Poste de développement

```bash
cd android
cp keystore.properties.example keystore.properties
# renseigner storeFile / storePassword / keyAlias / keyPassword
```

`android/keystore.properties` et `*.keystore` sont ignorés par git.

### Intégration continue

Quatre secrets à créer dans *Settings → Secrets and variables → Actions* :

| Secret | Contenu |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 android/app/gradeassist-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | mot de passe du magasin |
| `ANDROID_KEY_ALIAS` | alias de la clé (`gradeassist`) |
| `ANDROID_KEY_PASSWORD` | mot de passe de la clé |

Le workflow `release.yml` restaure le fichier dans `$RUNNER_TEMP`, exporte les
variables `ANDROID_KEYSTORE_*`, et **échoue explicitement** si l'un des secrets
manque. Côté Gradle, `assembleRelease` lève une erreur plutôt que de produire un
APK non signé (`android/app/build.gradle`).

### Générer un nouveau keystore

```bash
keytool -genkeypair -v \
  -keystore android/app/gradeassist-release.keystore \
  -alias gradeassist \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass "<mot_de_passe>" -keypass "<mot_de_passe>"
```

Conserver une copie hors ligne (coffre-fort, sauvegarde chiffrée) : sans ce
fichier, aucune mise à jour de l'application ne pourra plus être publiée.

---

## 4. Purger l'historique

```bash
bash scripts/purge-secrets-history.sh
```

Le script utilise `git filter-repo` sur une **copie de travail**, demande
confirmation, puis affiche la commande de publication forcée. Il ne pousse rien
lui-même.

> La purge réécrit tous les commits : les collaborateurs doivent re-cloner le
> dépôt. Les *forks* et les caches GitHub peuvent conserver les anciens objets —
> c'est pourquoi la révocation des secrets reste indispensable.

---

## 5. Variables d'environnement

| Variable | Usage | Obligatoire |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL (comptes) | oui pour l'authentification |
| `JWT_SECRET` | signature des sessions | oui pour l'authentification |
| `ALLOWED_API_ORIGINS` | origines supplémentaires autorisées à appeler `/api/ai` (séparées par des virgules) | non |
| `ANDROID_KEYSTORE_*` | signature Android | oui en CI |

Le modèle complet figure dans `.env.example`. Ne jamais préfixer un secret par
`NEXT_PUBLIC_`, ce qui l'exposerait dans le bundle client.

---

## 6. Signaler une vulnérabilité

Écrire à l'adresse de contact du projet plutôt que d'ouvrir un ticket public.
Préciser la version, la plateforme (web / Windows / Android) et les étapes de
reproduction.
