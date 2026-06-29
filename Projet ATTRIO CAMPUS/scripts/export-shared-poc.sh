#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="ATTRIO CAMPUS"
DEFAULT_TARGET="/Users/jb/Library/Mobile Documents/com~apple~CloudDocs/Attrio/POC JB/CAMPUS"
TARGET_DIR="${1:-$DEFAULT_TARGET}"

DOC_DEST="$TARGET_DIR/documentation"
SOURCE_DEST="$TARGET_DIR/source"

echo "→ Export du pack partagé pour $PROJECT_NAME"
echo "→ Source : $PROJECT_DIR"
echo "→ Cible  : $TARGET_DIR"

mkdir -p "$DOC_DEST" "$SOURCE_DEST"

cat > "$TARGET_DIR/README-PARTAGE.md" <<EOF
# ATTRIO CAMPUS — PACK PARTAGÉ

Ce dossier est une copie de travail propre du POC ATTRIO CAMPUS, préparée pour lecture, reprise et transmission.

## Structure

- \`documentation/\` : documents métier, fonctionnels, techniques et transmission
- \`source/\` : code utile du projet, prêt à être relu ou repris

## Important

Cette copie exclut volontairement :

- les secrets locaux,
- les dépendances lourdes,
- les builds temporaires,
- l'historique Git local.

## Source de vérité

La source de vérité reste le projet local / dépôt Git actif.
Ce dossier partagé est un **export propre de transmission**.
EOF

for file in \
  "DOCUMENTATION-TRANSMISSION.md" \
  "DOC-METIER.md" \
  "DOC-FONCTIONNELLE.md" \
  "DOC-TECHNIQUE.md" \
  "ARCHITECTURE-V2.md" \
  "SUPABASE-SETUP.md" \
  "DEPLOIEMENT-VERCEL.md" \
  "HANDOFF/README.md" \
  "HANDOFF/A-LIRE-EN-PREMIER.md"
do
  cp "$PROJECT_DIR/$file" "$DOC_DEST/"
done

mkdir -p "$SOURCE_DEST"

rsync -a --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude '.env.local' \
  --exclude '.DS_Store' \
  --exclude 'HANDOFF/' \
  "$PROJECT_DIR/src" \
  "$PROJECT_DIR/public" \
  "$PROJECT_DIR/scripts" \
  "$PROJECT_DIR/supabase" \
  "$PROJECT_DIR/launchers" \
  "$SOURCE_DEST/"

cp "$PROJECT_DIR/package.json" "$SOURCE_DEST/"
cp "$PROJECT_DIR/package-lock.json" "$SOURCE_DEST/"
cp "$PROJECT_DIR/index.html" "$SOURCE_DEST/"
cp "$PROJECT_DIR/.env.example" "$SOURCE_DEST/"

echo "✓ Pack partagé mis à jour"
echo "  - documentation : $DOC_DEST"
echo "  - source        : $SOURCE_DEST"
