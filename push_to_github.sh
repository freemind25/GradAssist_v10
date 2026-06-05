#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# push_to_github.sh — Publie GradeAssist v10 sur GitHub
# Usage : bash push_to_github.sh <VOTRE_PAT_GITHUB>
#
# Créer un PAT sur : https://github.com/settings/tokens/new
# Scopes requis : repo (accès complet aux dépôts)
# ─────────────────────────────────────────────────────────────────────────────

set -e

PAT="${1:-}"

if [ -z "$PAT" ]; then
  echo "❌  Usage : bash push_to_github.sh <VOTRE_GITHUB_PAT>"
  echo "    Exemple : bash push_to_github.sh ghp_xxxxxxxxxxxx"
  echo ""
  echo "    Créer un PAT : https://github.com/settings/tokens/new"
  echo "    Scopes requis : repo"
  exit 1
fi

REPO="https://${PAT}@github.com/freemind25/GradAssist_v10.git"

echo "🔧  Configuration du remote..."
git remote set-url origin "$REPO"

echo "📤  Push vers main..."
git push origin main

# Nettoyer le PAT de l'URL remote après le push
git remote set-url origin "https://github.com/freemind25/GradAssist_v10.git"

echo ""
echo "✅  Publié avec succès !"
echo "    👉  https://github.com/freemind25/GradAssist_v10"
echo ""
echo "    Ce qui a été publié :"
echo "    • src/  — source complète (7 composants + 23 UI ShadCN)"
echo "    • cypress/  — 8 suites E2E"
echo "    • ARCHITECTURE.md  — documentation technique"
echo "    • .github/workflows/ci.yml  — pipeline CI (quality + e2e)"
echo "    • Corrections : next.config.ts, .gitignore, package.json"
