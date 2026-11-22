#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# push_to_github.sh — Publie la branche courante sur GitHub
#
# Le jeton d'accès NE DOIT PAS être passé en argument : les arguments de
# commande restent visibles dans l'historique du shell et dans la liste des
# processus. Utilisez l'une de ces deux méthodes :
#
#   1. GitHub CLI (recommandé) :
#        gh auth login
#        bash push_to_github.sh
#
#   2. Variable d'environnement :
#        export GITHUB_TOKEN="$(gh auth token)"
#        bash push_to_github.sh
#
# Ne collez jamais un jeton dans un fichier versionné (voir SECURITY.md).
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_SSH="git@github.com:freemind25/GradAssist_v10.git"
REPO_HTTPS="https://github.com/freemind25/GradAssist_v10.git"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "🔐  Authentification via GitHub CLI détectée."
  git push origin "$BRANCH"
elif [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "🔐  Authentification via GITHUB_TOKEN."
  # Le jeton n'apparaît que dans l'environnement du processus git, jamais
  # dans les arguments ni sur la sortie standard.
  GIT_ASKPASS=/bin/echo \
  GIT_TERMINAL_PROMPT=0 \
  git -c credential.helper= \
      -c credential.username=x-access-token \
      push "https://x-access-token:${GITHUB_TOKEN}@github.com/freemind25/GradAssist_v10.git" "$BRANCH"
else
  echo "❌  Aucune authentification disponible."
  echo ""
  echo "    Option 1 : gh auth login"
  echo "    Option 2 : export GITHUB_TOKEN=\"votre_jeton\""
  echo ""
  echo "    Créer un jeton à portée minimale (fine-grained, contenu: read/write"
  echo "    sur ce seul dépôt) : https://github.com/settings/tokens?type=beta"
  echo "    Puis révoquer tout ancien jeton ayant circulé en clair."
  exit 1
fi

echo ""
echo "✅  Branche « ${BRANCH} » publiée."
echo "    👉  ${REPO_HTTPS}"
echo ""
echo "    Rappel : les secrets (clés API, keystore) ne doivent jamais être"
echo "    commités. Voir SECURITY.md pour la procédure de rotation."
