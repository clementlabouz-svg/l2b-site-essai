#!/usr/bin/env bash
# Étape 1 — Récupère le site en ligne dans original/ (copie de référence, à ne jamais modifier).
# Le site en ligne n'est que lu : rien n'est envoyé ni modifié dessus.
set -euo pipefail
cd "$(dirname "$0")/.."

SITE="${1:-https://www.l2b-energies.fr}"

mkdir -p original
cd original
# Commande demandée, telle quelle. wget renvoie un code d'erreur dès qu'un seul
# lien est cassé sur le site : on n'arrête donc pas le script pour ça.
wget --mirror --convert-links --page-requisites --no-parent "$SITE" || echo "wget a signalé des erreurs (souvent un lien cassé) — vérifier le contenu de original/"

echo
echo "Pages récupérées :"
find . -name '*.html' | sort | head -50
du -sh .
