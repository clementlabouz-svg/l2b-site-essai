#!/usr/bin/env node
// Étape 2 — Construit essai/ : copie exacte de original/ + le calque visuel.
// Seul ajout dans chaque page HTML : quelques lignes juste avant </head>
// (feuille de style, script d'animations). Textes, photos et coordonnées ne bougent pas.
//
// Usage : node outils/2-construire-essai.cjs [dossier-original] [dossier-essai]
'use strict';
const fs = require('fs');
const path = require('path');

const racine = path.resolve(__dirname, '..');
const original = path.resolve(process.argv[2] || path.join(racine, 'original'));
const essai = path.resolve(process.argv[3] || path.join(racine, 'essai'));
const calque = path.join(racine, 'calque');
const NOM_CALQUE = 'l2b-essai';

if (!fs.existsSync(original)) {
  console.error(`Dossier introuvable : ${original}\nLancer d'abord outils/1-recuperer-original.sh`);
  process.exit(1);
}

// 1. Copie fidèle de l'original.
fs.rmSync(essai, { recursive: true, force: true });
fs.cpSync(original, essai, { recursive: true });

// 2. Le calque va à côté de la page d'accueil (dossier du site, ex. essai/www.l2b-energies.fr/).
const accueil = trouveAccueil(essai);
const dossierSite = path.dirname(accueil);
const dossierCalque = path.join(dossierSite, NOM_CALQUE);
fs.cpSync(calque, dossierCalque, { recursive: true });

// 3. Injection dans chaque page HTML.
const DEBUT = '<!-- L2B essai visuel : début -->';
const FIN = '<!-- L2B essai visuel : fin -->';
let pages = 0;
let octetsAjoutes = 0;
for (const fichier of listeHtml(essai)) {
  const source = fs.readFileSync(fichier, 'utf8');
  if (!/<\/head>/i.test(source)) continue;
  const rel = path.relative(path.dirname(fichier), dossierCalque).split(path.sep).join('/') || '.';
  const bloc = [
    DEBUT,
    // Ajouté tout de suite (avant l'affichage) pour éviter un clignotement du titre.
    `<script>if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)&&'IntersectionObserver' in window)document.documentElement.classList.add('l2b-anim')</script>`,
    `<link rel="stylesheet" href="${rel}/l2b-essai.css">`,
    `<script src="${rel}/l2b-essai.js" defer></script>`,
    FIN,
    ''
  ].join('\n');
  const sansAncien = source.replace(new RegExp(`${DEBUT}[\\s\\S]*?${FIN}\\n?`), '');
  const resultat = sansAncien.replace(/<\/head>/i, bloc + '</head>');
  fs.writeFileSync(fichier, resultat);
  pages++;
  octetsAjoutes += Buffer.byteLength(resultat) - Buffer.byteLength(source);
}

const poidsCalque = listeFichiers(dossierCalque)
  .filter((f) => !/LICENCE/.test(f))
  .reduce((total, f) => total + fs.statSync(f).size, 0);
console.log(`Page d'accueil : ${path.relative(racine, accueil)}`);
console.log(`Pages HTML modifiées : ${pages} (+${octetsAjoutes} octets au total, soit ~${Math.round(octetsAjoutes / Math.max(pages, 1))} par page)`);
console.log(`Calque copié dans ${path.relative(racine, dossierCalque)} : ${(poidsCalque / 1024).toFixed(1)} Ko (hors licences)`);

function listeFichiers(dossier) {
  return fs.readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dossier, e.name);
    return e.isDirectory() ? listeFichiers(p) : [p];
  });
}
function listeHtml(dossier) {
  return listeFichiers(dossier).filter((f) => /\.html?$/i.test(f) && !f.includes(`${path.sep}${NOM_CALQUE}${path.sep}`));
}
function trouveAccueil(dossier) {
  const candidats = listeFichiers(dossier)
    .filter((f) => path.basename(f).toLowerCase() === 'index.html')
    .sort((a, b) => a.split(path.sep).length - b.split(path.sep).length);
  if (!candidats.length) throw new Error(`Aucun index.html dans ${dossier}`);
  return candidats[0];
}
