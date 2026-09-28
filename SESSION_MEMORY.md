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

### F. Analyse SDK tiers (demandes d'analyse de dépôt)
- **strands-agents/harness-sdk** : SDK agents IA (TS/Python), model-agnostique, tools, MCP, guardrails, streaming. Recommandation : ne l'adopter que pour transformer l'assistant en agent avec tools ; sinon rester sur le fetch Mistral actuel.

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
