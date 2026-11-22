#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# purge-secrets-history.sh — Supprime de l'HISTORIQUE git les fichiers ayant
# contenu des secrets (clé API Mistral, keystore Android).
#
# ⚠️  Opération destructrice et irréversible pour l'historique :
#     - elle réécrit tous les commits ;
#     - elle nécessite un `git push --force` vers le dépôt distant ;
#     - les collaborateurs devront re-cloner le dépôt.
#
# La purge ne remplace PAS la révocation : un secret exposé doit être révoqué
# même après purge (les forks et caches peuvent conserver les anciens objets).
# Voir SECURITY.md.
#
# Prérequis : pip install git-filter-repo
# Usage     : bash scripts/purge-secrets-history.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_URL="https://github.com/freemind25/GradAssist_v10.git"
TARGETS=(
  "SESSION_MEMORY.md"
  "android/app/gradeassist-release.keystore"
)

echo "═══════════════════════════════════════════════════════════════════"
echo " Purge de l'historique — GradeAssist"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Fichiers retirés de tous les commits :"
for t in "${TARGETS[@]}"; do echo "  • $t"; done
echo ""

# ── Vérifications préalables ────────────────────────────────────────────
if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "❌  git-filter-repo est introuvable."
  echo "    Installation : pip install git-filter-repo"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "❌  L'arbre de travail n'est pas propre. Commitez ou remisez avant de purger."
  exit 1
fi

if [ ! -d .git ]; then
  echo "❌  À exécuter depuis la racine du dépôt."
  exit 1
fi

echo "⚠️  Cette opération réécrit TOUT l'historique. Un miroir de sauvegarde"
echo "    va être créé dans ../gradeassist-backup.git avant toute modification."
echo ""
read -r -p "Tapez PURGER pour continuer : " CONFIRM
if [ "$CONFIRM" != "PURGER" ]; then
  echo "Annulé."
  exit 0
fi

# ── Sauvegarde ──────────────────────────────────────────────────────────
BACKUP="../gradeassist-backup-$(date +%Y%m%d-%H%M%S).git"
git clone --mirror . "$BACKUP"
echo "✅  Sauvegarde : $BACKUP"
echo ""

# ── Purge ───────────────────────────────────────────────────────────────
ARGS=()
for t in "${TARGETS[@]}"; do ARGS+=(--path "$t"); done

git filter-repo --force --invert-paths "${ARGS[@]}"

# filter-repo retire les remotes : les rétablir.
git remote add origin "$REPO_URL"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo " Purge terminée."
echo ""
echo " Vérification :"
echo "   git log --all --oneline -- ${TARGETS[*]}   # doit être vide"
echo ""
echo " Publication (à faire en connaissance de cause) :"
echo "   git push --force --all origin"
echo "   git push --force --tags origin"
echo ""
echo " Puis, impérativement :"
echo "   1. révoquer la clé Mistral exposée ;"
echo "   2. révoquer l'ancien jeton GitHub ;"
echo "   3. prévenir les collaborateurs de re-cloner le dépôt."
echo "═══════════════════════════════════════════════════════════════════"
