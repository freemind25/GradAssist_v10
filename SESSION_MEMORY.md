# Mémoire de session — GradeAssist v10

> Fichier créé pour conserver le contexte des sessions passées (Buffy / Codebuff).
> À mettre à jour à chaque session majeure. Date de dernière mise à jour : 28 septembre 2026.

---

## 1. À propos du projet

- **Application** : GradeAssist v10 — évaluation universitaire pour enseignants algériens (notes, présences, encadrement de mémoires, canevas de cours, exports PDF/CSV au format officiel, dashboard analytics, assistant IA).
- **Stack** : Next.js 15.2.8, React 19, TypeScript 5, Tailwind CSS 3, jsPDF, recharts, SheetJS, pdfjs-dist, Capacitor (Android), Bun.
- **Production** : Vercel → `https://grad-assist-v10.vercel.app`
- **Preview sandbox** : `freebuff-preview` (URL type `https://3000-<id>.daytonaproxy01.net`)
- **Audit** : `AUDIT_REPORT.md` (26 août 2026) — 27 fonctionnalités, 81 % de couverture, problèmes bloquants B1 (pas d'auth) et B2 (pas de backup cloud).
- **Client OAuth Google** : `1088043365323-6n4ke2fp5fofed19vjje7gm097lsvbj7.apps.googleusercontent.com`

---

## 2. Travaux réalisés (chronologique)

### A. Vérification Google Search Console / écran de consentement OAuth
- Fichier de vérification `public/google2114237d9f343bbc.html` ajouté.
- **Problème diagnostiqué** : Vercel servait le fichier sans l'extension `.html` (URL propre) alors que Google exige `.../google2114237d9f343bbc.html` → 404 → échec de validation.
- **Fix** : `vercel.json` avec rewrite servant le fichier à l'URL `.html` (commit `2ffaa54`). Vérifié : HTTP 200 + contenu exact attendu.
- Balise meta ajoutée dans `src/app/layout.tsx` :
  `<meta name="google-site-verification" content="eRtIT0Ed_OUKXy99B_y7lvaZUU9OU8GuiMyk-4fIAdQ"/>` (commit `e4e5ec2`), vérifiée en production.
- URLs du formulaire de consentement :
  - Homepage : `https://grad-assist-v10.vercel.app`
  - Confidentialité : `https://grad-assist-v10.vercel.app/confidentialite`
  - Conditions : `https://grad-assist-v10.vercel.app/conditions`
- Bannière « le site n'est pas enregistré à votre nom » = résidu d'une tentative précédente + possible incohérence de compte Google ; se efface après re-save + resoumission du consent screen.

### B. Assistant IA Mistral
1. **Route API créée** : `src/app/api/mistral/route.ts` — proxy POST → `https://api.mistral.ai/v1/chat/completions`. Clé lue depuis le body (client/localStorage) avec fallback `process.env.MISTRAL_API_KEY`.
2. **Modèle par défaut** : `open-mistral-7b` (seul modèle du tier gratuit accessible au compte ; `mistral-large-latest` refusé). Clés testées : `2vdor7BolNkh4Y9MseSvgvntsJ5KfsYZ` (invalide), `ZQCY3KkDaT9edRFpCk2y52VEXIJugjHJ` (valide — **à révoquer**, voir §4).
3. **Fix critique** : `output: 'export'` retiré de `next.config.ts` (commit `c795e36`). En statique, les routes API ne sont pas déployées sur Vercel → chaque appel IA échouait (502/réseau). Après fix : `ƒ /api/mistral` dynamic, pages `/`, `/conditions`, `/confidentialite` restent statiques.
4. **Client `src/components/ai-assistant.tsx`** : vérification `res.ok` avant parsing JSON, messages explicites FR pour 401/403/502/503/504 (commit `57be0e3`).
5. **Vérifié fonctionnel** : « ça marche ! l'IA fonctionne » (l'utilisateur a confirmé).

### C. Incidents preview (résolus)
- 502 `proxy upstream error` intermittents sur `/` et `/api/mistral` → preview arrêté ; règle : `freebuff-preview status` puis `freebuff-preview start` (ne jamais tuer/restart un serveur manuellement).

### D. Audit de sécurité dépôt (fait, actions utilisateur en attente)
- `.env`/`.env.local` bien dans `.gitignore` ; aucune clé hardcodée dans le code source.
- ⚠️ Clé Mistral exposée dans le chat → **à révoquer sur console.mistral.ai** puis nouvelle clé via `freebuff-env set --file .env.local '{"MISTRAL_API_KEY":"..."}'`.
- Recommandations restées ouvertes : protection de branche `main`, dépôt en Private, Dependabot/CodeQL, authentification (B1), backup cloud (B2).

### E. Pipeline APK / Android (28 septembre 2026)
- **Origine des APK v2.9.5/v2.9.6** : construits en local (aucun workflow Android dans le repo, `gh workflow run` absent), attachés manuellement aux releases. L'APK v2.9.6 est un build Capacitor standard (`BridgeActivity`) chargant https://grad-assist-v10.vercel.app/ via la config embarquée.
- **Piège découvert** : `android/` était non tracké et son `MainActivity.java` était une WebView custom codée en dur sur une URL sandbox Daytona (héritage du bug « backend mort »). Un build depuis cet état aurait produit un APK HS.
- **Fix** : `MainActivity.java` → `BridgeActivity` Capacitor standard (URL Vercel via `capacitor.config.ts`, source de vérité unique) ; `android/app/src/main/assets/capacitor.config.json` réaligné sur la config TS (cleartext false) ; `android/` versionné (55 fichiers, builds exclus via `android/.gitignore`) ; signature release propre (keystore `android/app/gradeassist-release.keystore` versionné, mots de passe dans `build.gradle`, alias `gradeassist` — remplacera les APK signés debug : réinstallation sans désinstaller possible si même signature) ; versionCode 2 / versionName 2.9.9.
- **CI** : `release.yml` étendu — job `build-android` (ubuntu, Java 21 temurin, SDK Android, `./gradlew assembleRelease`) + renommage `GradeAssist-<version>.apk` dans le job release.
- **Prérequis build Android local** : Java 21 OK, SDK Android absent (ANDROID_HOME vide) → le build se fait en CI.
- **Prérequis pour upgrader depuis l'APK 2.9.6 (signé debug)** : désinstaller l'ancienne version avant d'installer la nouvelle (signature différente) ; à partir de 2.9.9, les mises à jour suivantes s'installent par-dessus.
- `npx cap sync android` (script `cap:sync`) à relancer si la config Capacitor change.
- **Résultat** : release v2.9.9 publiée le 28/09/2026 après 3 itérations CI — `GradeAssist-2.9.9.apk` (3 Mo, config Vercel embarquée vérifiée, signature release) + `GradeAssist.Setup.2.9.9.exe` (80 Mo). Échecs corrigés : `android-actions/setup-android` (paquet `tools` supprimé → retiré), `capacitor-cordova-android-plugins` absent du checkout (→ step `npx cap sync android` avant gradlew), CLI Capacitor 8 exige Node ≥ 22 (→ job android sur Node 22).
- **Aperçu PDF Canevas : ✅ confirmé fonctionnel par l'utilisateur** (28 septembre 2026) — les 3 couches de correctifs (081fe29, abe51f7, cfacc5a) sont validées en production.

### F. Analyse SDK tiers (demandes d'analyse de dépôt)
- **strands-agents/harness-sdk** : SDK agents IA (TS/Python), model-agnostique, tools, MCP, guardrails, streaming. Recommandation : ne l'adopter que pour transformer l'assistant en agent avec tools ; sinon rester sur le fetch Mistral actuel.

### G. Assistant IA BYOK multi-fournisseurs (1er octobre 2026, en attente validation utilisateur)
- **Contexte** : le tier gratuit Mistral n'est plus disponible → l'ajout d'une clé Mistral gratuite ne fonctionne plus. Demande utilisateur : proposer une liste de fournisseurs connus + ceux qui donnent des accès gratuits, dont https://routesme.online/ (API compatible OpenAI, base `https://routesme.online/v1`, clé gratuite avec quota quotidien, Model ID exemple `GLM5.2R` — non vérifié par appel API réel ; champ modèle optionnel laisse l'utilisateur corriger).
- **Architecture BYOK (Bring Your Own Key)** : registre statique de 6 providers dans le code ; URL upstream TOUJOURS résolue côté serveur depuis le registre (anti-SSRF, jamais acceptée du client) ; clé utilisateur en localStorage ; modèle client nettoyé par whitelist regex.
- **Fichiers** :
  - `src/lib/ai-providers.ts` (NOUVEAU) : interface `AiProvider`, registre `AI_PROVIDERS` = routesme (défaut, Gratuit), groq (`llama-3.1-8b-instant`, Gratuit, console.groq.com/keys), openrouter (`openrouter/auto`, modèles :free), gemini (`gemini-2.0-flash`, Gratuit, endpoint OpenAI-compat), openai (`gpt-4o-mini`), mistral (`mistral-small-latest`, payant). `AI_STORAGE_KEYS` = `{gradeAssist_aiApiKey, gradeAssist_aiProvider, gradeAssist_aiModel}` ; `LEGACY_MISTRAL_KEY` = `gradeAssist_mistralApiKey` ; `getAiProvider(id)` fallback routesme.
  - `src/lib/ai-proxy.ts` (NOUVEAU) : `handleAiChat(body)` — validation (≤50 messages, ≤8000 car., rôles whitelistés), clé ≥8 car. sinon 401 FR, `sanitizeModel`, fetch POST `Authorization: Bearer`, temp défaut 0.2, erreurs FR mappées (401/403 clé, 404 modèle, 429 quota, 402 crédit→suggérer RoutesMe/Groq/Gemini, 5xx), réponse `{content, provider, model}`.
  - `src/app/api/ai/route.ts` (NOUVEAU) : POST → `handleAiChat`.
  - `src/app/api/mistral/route.ts` (RÉÉCRIT) : shim compat → force `providerId:"mistral"`, ancien contrat `{messages, apiKey?, model?}` conservé (fallback serveur `MISTRAL_API_KEY` supprimé).
  - `src/components/ai-provider-settings.tsx` (NOUVEAU) : Select provider avec badges « Gratuit », Input password clé + lien docsUrl, Input modèle optionnel, persistance localStorage, migration ancienne clé mistral, badge « Clé enregistrée ».
  - `src/components/ai-assistant.tsx` (MODIFIÉ) : fetch `/api/ai` avec `{messages, providerId, apiKey, model?}`, lecture localStorage à chaque envoi, garde sans clé (message FR), erreurs paramétrées par `providerName`, titre dialog « Assistant IA ».
  - `src/components/student-project-info-form.tsx` (MODIFIÉ) : `<AiProviderSettings />` remplace le champ clé Mistral.
  - `src/components/help-guide-dialog.tsx` (MODIFIÉ) : section « Assistant IA (multi-fournisseurs) » + section « Obtenir une clé API IA (gratuit) » décrivant RoutesMe/Groq/Gemini ; toutes les mentions Mistral génériques remplacées.
- **CSP** : aucun changement `next.config.ts` nécessaire — le proxy serveur `/api/ai` appelle les providers, pas le navigateur.
- **Typecheck** : `bun run typecheck` ✅ (1er octobre 2026). Grep de régression ✅ : plus aucune utilisation client de `/api/mistral` ni de la clé legacy (seuls le shim et la constante de migration restent).
- **Validé en direct avec la clé utilisateur** (1er octobre 2026) : GET `/v1/models` → HTTP 200 (20 modèles listés) ; POST `/chat/completions` avec la clé via proxy `/api/ai` → HTTP 200, réponse FR correcte (`{"content":"Un enseignant universitaire a pour rôle d'enseigner…","provider":"routesme","model":"LING-3.0-Flash"}`). Garde 401 sans clé vérifiée. `bun run typecheck` ✅.
- **Modèle RoutesMe** : `GLM5.2R` indisponible (503 `all_keys_failed` — backends saturés, confirmé aussi sur AUTO-R, GLM5.3-flash, Kimi-k3, DeepSeek, Step-3.7) ; un 429 `rate_limited` réel prouve que la clé atteint bien le backend. **Modèle par défaut changé → `LING-3.0-Flash`** (seul modèle qui a répondu ; les modèles 503 reviendront probablement plus tard — l'utilisateur peut toujours en choisir un autre dans le champ modèle).
- **Durcissement proxy** : une relance automatique (pause 1,2 s) pour les 502/503/504 transitoires dans `src/lib/ai-proxy.ts`.
- **Sécurité** : la clé utilisateur a transité dans des commandes curl de test — l'utilisateur devrait la régénérer depuis routesme.online si le souhaité ; elle n'est jamais loggée par le code.
- **Commit** : `9b3f373` (fonctionnalité BYOK) + `acb85eb` (release v2.9.10 + guide), poussés sur main → déploiement Vercel auto.

### H. Release v2.9.10 (1er octobre 2026) — ✅ publiée
- **Tag `v2.9.10`** → CI verte (build-android, build-windows, release). Assets : `GradeAssist-2.9.10.apk` (3,2 Mo) + `GradeAssist.Setup.2.9.10.exe` (80 Mo).
- **versionCode 3 / versionName 2.9.10** (android/app/build.gradle), package.json 2.9.10.
- **SHA-256 APK** : `2d841b3eac0b8f20cceb7e45e57e0ea29ddcd9f83adefac5a01175e140f86f4e` (publié dans les notes de release).
- **Question utilisateur « installateur APK »** : pas d'installeur possible — Android gère les APK nativement ; les apps « installateur APK » ne font qu'envelopper le réglage « Autoriser depuis cette source ». Réponse : **`public/installer-android.html`** (guide autonome, vérifié HTTP 200 sur https://grad-assist-v10.vercel.app/installer-android.html) + section installation dans les notes de release (SHA-256, Play Protect « Plus de détails → Installer quand même », maj depuis 2.9.9 par-dessus / depuis 2.9.6 désinstallation requise).
- Notes de release enrichies (tableau fournisseurs + guide installation + SHA-256).

### I. Fix « Requête invalide » + bouton « Tester la clé » (1er octobre 2026)
- **Bug signalé par l'utilisateur** (test RoutesMe en production) : « Requête invalide : messages manquants ou malformés » → cause : `MAX_CONTENT = 8000` dans `ai-proxy.ts`, dépassé par le prompt système dès qu'un module contient des données réelles (contexte complet des étudiants/présences/canevas). **Fix : `MAX_CONTENT = 200_000` + `MAX_MESSAGES = 100`.** Validé en preview : contexte de 23 524 caractères → HTTP 200 (modèle LING-3.0-Flash, comptage exact des 200 étudiants du test).
- **Bouton « Tester la clé »** ajouté dans `ai-provider-settings.tsx` : vraie requête via `/api/ai` (system + user courts), spinner, résultat vert (avec snippet de réponse + modèle) / rouge (message d'erreur FR du fournisseur). Se déclenche aussi utilement après changement de modèle.

---

## 3. Conventions de travail établies

- **Git** : Freebuff injecte le credential GitHub (pas de PAT/SSH). Ne faire `git commit/push` que sur demande explicite. Préserver les changements utilisateur, pas de reset/clean destructif.
- **Env** : ne jamais lire/imprimer `.env` ; utiliser `freebuff-env list` (noms uniquement) et `freebuff-env set --file .env.local '{"KEY":"value"}' --restart`. Clés secrètes uniquement fournies par l'utilisateur, sinon les demander dans Settings → Environment.
- **Preview** : `freebuff-preview start|restart|status|logs` ; jamais de `kill`, `nohup`, `&`, ni de lancement manuel de `next dev`.
- **Build/déploiement** : `freebuff-deploy check` avant déploiement, `freebuff-deploy status|logs`, `freebuff-deploy start` pour redéployer ; `freebuff-deploy env set` pour les env vars production. Ne jamais lancer `bun run build` sauf demande explicite (sinon typecheck : `bun run typecheck`).
- **Typecheck** : `bun run typecheck` (`tsc --noEmit`) avant chaque commit.
- **Test IA en direct** : `curl -X POST <preview>/api/mistral -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"..."}],"apiKey":"..."}'`.

---

## 4. TODO ouverts

- [ ] Révoquer la clé Mistral exposée `ZQCY3KkDaT9edRFpCk2y52VEXIJugjHJ`, en générer une nouvelle, la passer via `freebuff-env set` + production `freebuff-deploy env set`.
- [ ] Terminer la vérification domaine/consent screen Google (re-save + Soumettre pour vérification sous le compte rackho2002).
- [ ] Authentification (audit B1) et backup cloud (audit B2).
- [ ] Protection de branche `main`, dépôt Private, Dependabot.
- [ ] Corrections audit Horizon 1 : pré-remplir PV, champ matricule, rendu PDF canevas.
