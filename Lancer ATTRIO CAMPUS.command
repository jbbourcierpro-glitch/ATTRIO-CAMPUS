#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$ROOT_DIR/Projet ATTRIO CAMPUS"

cd "$PROJECT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm est introuvable sur ce Mac."
  echo "Installe Node.js puis relance ce fichier."
  echo "https://nodejs.org/"
  echo
  read -r -p "Appuie sur Entrée pour fermer..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installation des dépendances..."
  npm install
fi

echo "Démarrage d'ATTRIO CAMPUS..."
npm run desktop:start

echo
read -r -p "Appuie sur Entrée pour fermer..."
