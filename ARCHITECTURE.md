# Architecture — GradeAssist 2.9.12

> Document de référence technique, aligné sur le code au 22 novembre 2026.
> Les versions antérieures décrivaient une application tout-localStorage qui n'existe plus.

---

## 1. Vue d'ensemble

GradeAssist est une application **Next.js 15 (App Router)** déployée sur Vercel, encapsulée pour Windows (Electron) et Android (Capacitor). Les deux coquilles natives chargent l'URL de production : elles ne contiennent pas l'application.

```
┌──────────────────────────────────────────────────────────────────┐
│ Client (navigateur, WebView Android, fenêtre Electron)           │
│                                                                  │
│  page.tsx  ──état unique──► modules[] + activeModuleId           │
│      │                                                           │
│      ├─► EvaluationModule ──► 12 composants d'onglets            │
│      ├─► localStorage : modules, profil, clé IA, jeton Drive      │
│      └─► IndexedDB : PDF du canevas (une entrée par module)       │
└───────────────┬──────────────────────────────────────────────────┘
                │ HTTPS
┌───────────────▼──────────────────────────────────────────────────┐
│ Vercel (Next.js serverless)                                      │
│                                                                  │
│  /api/auth   → Neon (users) + bcrypt + JWT httpOnly              │
│  /api/ai     → proxy BYOK vers 7 fournisseurs (URL côté serveur)  │
│  /api/mistral→ alias historique de /api/ai                        │
│  /api/health → sonde                                               │
│  middleware  → CSP à nonce + en-têtes de sécurité                 │
└──────────────────────────────────────────────────────────────────┘
```

**Principe directeur** : les données pédagogiques ne quittent jamais l'appareil. Seuls l'authentification (comptes), l'assistance IA (contexte du module, à la demande) et l'envoi explicite vers Google Drive passent par le réseau.

---

## 2. Structure réelle

```
src/
├── app/
│   ├── page.tsx                 # orchestrateur : état, onglets, sauvegarde/restauration
│   ├── layout.tsx               # layout racine
│   ├── api/{auth,ai,mistral,health}/route.ts
│   ├── auth/{login,signup}/     # pages orphelines (aucun lien produit)
│   ├── conditions/, confidentialite/
├── components/                  # 12 modules métier + 23 primitives ShadCN (ui/)
├── lib/
│   ├── export-service.ts        # PDF et CSV (jsPDF)
│   ├── export-guard.ts          # enregistrement natif / téléchargement web
│   ├── backup-service.ts        # export/restauration JSON des modules
│   ├── platform.ts              # détection WebView / Electron
│   ├── auth.ts, db.ts           # Neon + bcrypt + JWT
│   ├── ai-proxy.ts, ai-providers.ts, api-guard.ts, rate-limit.ts
│   ├── google-drive-service.ts  # OAuth implicite + upload
│   └── student-names.ts, file-validation.ts, utils.ts
├── config/grading-config.ts     # critères par défaut, barème A+ → F
├── types/index.ts               # modèle de données
└── hooks/                       # use-toast, use-mobile
```

---

## 3. Modèle de données

Tout tient dans un objet unique :

```ts
EvaluationModule {
  id: string;
  name: string;
  type: 'atelier' | 'standard' | 'mooc';
  evaluationData: EvaluationData;   // ~45 champs
}
```

`EvaluationData` regroupe, sans normalisation : identité institutionnelle, étudiants, enseignants, logo (base64), critères (`Criterion[]`), notes sélectionnées (`selectedGrades`), présences (`{[date]: {[nom]: statut}}`), mémoires (`ThesisStudent[]`), canevas (`CourseSyllabus`), notes rapides, groupes, tutorat et configuration d'alertes.

**Limite structurelle** : l'étudiant n'a pas d'identifiant stable, son **nom sert de clé** pour les présences, les notes rapides et les groupes. Deux homonymes s'écrasent ; un renommage perd l'historique. Et surtout, **aucun résultat par étudiant n'est stocké** : `selectedGrades` ne décrit que l'étudiant affiché. C'est ce qui empêche le PV de se remplir et la détection par seuil de note de fonctionner.

---

## 4. État et persistance

- **Propriétaire unique** : `page.tsx` détient `modules[]` et `activeModuleId`; tout descend par props.
- **Écriture différée** de 1 000 ms après la dernière modification, plus une écriture forcée sur `pagehide` / `visibilitychange` (sinon la dernière saisie était perdue à la fermeture).
- **Quota** : un échec d'écriture déclenche un bandeau explicite ; le pied de page affiche l'espace occupé.
- **Sauvegarde** : fichier JSON versionné (`backup-service.ts`), restauration avec validation et complétion des champs manquants, au choix « remplacer » ou « ajouter ».

---

## 5. Routes API

| Route | Rôle | Protection |
|---|---|---|
| `POST /api/auth` | login / signup / logout | quota 10 tentatives / 15 min, 5 inscriptions / h |
| `GET /api/auth` | session courante | — |
| `POST /api/ai` | proxy IA multi-fournisseurs | origine + 30 req / 10 min par IP + plafond 600 k caractères |
| `POST /api/mistral` | alias, fournisseur forcé | idem |
| `GET /api/health` | sonde | publique |

Le middleware ne couvre pas `/api` : les contrôles vivent dans `api-guard.ts`. La limitation de débit est en mémoire, donc **par instance** — suffisante contre un abus naïf, pas contre un attaquant distribué (Upstash Redis est prévu dans `.env.example`).

---

## 6. Exports

`export-service.ts` produit les PDF (jsPDF + autoTable) et les CSV (Blob + BOM UTF-8, échappement RFC 4180, protection contre l'injection de formules).

`export-guard.ts` choisit le mode d'enregistrement :

| Environnement | Mécanisme |
|---|---|
| navigateur / PWA | `<a download>` sur une URL `blob:` |
| WebView Android | `Filesystem.writeFile` dans `Documents/GradeAssist/` puis feuille de partage `Share` |

La détection se fait dans `platform.ts` (pont Capacitor ou marqueur `; wv)` du user-agent). Sans elle, la WebView ignorait le téléchargement **sans lever d'erreur**, tout en affichant un message de succès.

---

## 7. Authentification

- `users` (Neon) : `id`, `email`, `password_hash` (bcrypt, 10 tours), `role`, `department`.
- Session : JWT HS256, 8 h, cookie `httpOnly` / `secure` en production / `sameSite=lax`, algorithme épinglé à la vérification.
- **Mode invité** : profil local `role: "guest"`, sans session serveur. C'est un choix produit assumé ; il rend l'authentification non bloquante.
- Aucune vérification d'e-mail, pas de réinitialisation de mot de passe, pas de rotation de session.

---

## 8. Intégration continue et déploiement

| Workflow | Déclencheur | Contenu |
|---|---|---|
| `webpack.yml` (GradeAssist CI) | push et PR sur `main`, manuel | `npm ci`, `tsc --noEmit`, ESLint, `next build` |
| `release.yml` | tag `v*`, manuel | installeur Windows, APK Android signé, publication GitHub Releases |

- Le keystore n'est pas versionné : il est fourni par les secrets `ANDROID_KEYSTORE_*`, et `assembleRelease` échoue si la signature manque.
- Le job `release` exige un tag ; un lancement manuel ne publie rien.
- Cypress n'est exécuté par aucun workflow.

---

## 9. Dette connue

| Sujet | État |
|---|---|
| Résultat par étudiant | absent du modèle — bloque PV, exports standard, alertes |
| Rendu arabe des PV | impossible sans police embarquée |
| Synchronisation multi-appareils | non implémentée ; schéma `db.ts` écrit mais inutilisé |
| Suite Cypress | 77 tests périmés, hors CI |
| Configuration Cloudflare | `wrangler.toml` et `cloudflare-pages.config.json` obsolètes, builds fantômes |
| Dépendances | 105 vulnérabilités npm signalées ; montées majeures en attente (`zod 4`, `recharts 3`) |
| Composants | 8 fichiers > 500 lignes, logique métier dupliquée (conversion note → points en 3 exemplaires) |

Le rapport d'audit complet (novembre 2026) détaille ces points et propose un plan d'action priorisé.
