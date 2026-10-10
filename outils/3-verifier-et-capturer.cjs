#!/usr/bin/env node
// Étape 3 — Vérifie la version d'essai et fait les captures avant / après.
//   - téléphone (375 px) et ordinateur (1440 px) ;
//   - défilement horizontal, erreurs dans la console, poids ajouté ;
//   - textes, photos, téléphones et e-mails identiques à l'original ;
//   - « mouvement réduit » bien respecté.
// Résultats : captures/*.png|jpg et captures/resultats.json
//
// Usage : node outils/3-verifier-et-capturer.cjs [dossier-original] [dossier-essai] [dossier-captures]
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const racine = path.resolve(__dirname, '..');
const original = path.resolve(process.argv[2] || path.join(racine, 'original'));
const essai = path.resolve(process.argv[3] || path.join(racine, 'essai'));
const captures = path.resolve(process.argv[4] || path.join(racine, 'captures'));

const APPAREILS = {
  telephone: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  ordinateur: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
};
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject', '.mp4': 'video/mp4', '.webm': 'video/webm', '.xml': 'application/xml'
};

function chargePlaywright() {
  try { return require('playwright'); } catch (e) {
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

// Petit serveur local : sert les deux copies, sans rien envoyer sur Internet.
function lanceServeur(dossierRacine) {
  const serveur = http.createServer((req, res) => {
    let chemin = decodeURIComponent(req.url.split('#')[0]);
    // wget garde parfois « ?ver=… » dans le nom du fichier : on essaie d'abord tel quel.
    let fichier = path.join(dossierRacine, chemin);
    if (!fs.existsSync(fichier)) fichier = path.join(dossierRacine, chemin.split('?')[0]);
    if (fs.existsSync(fichier) && fs.statSync(fichier).isDirectory()) fichier = path.join(fichier, 'index.html');
    if (!fichier.startsWith(dossierRacine) || !fs.existsSync(fichier)) {
      res.writeHead(404); res.end(); return;
    }
    const extension = path.extname(fichier.split('?')[0]).toLowerCase();
    res.writeHead(200, { 'Content-Type': TYPES[extension] || 'application/octet-stream' });
    fs.createReadStream(fichier).pipe(res);
  });
  return new Promise((ok) => serveur.listen(0, '127.0.0.1', () => ok(serveur)));
}

function trouveAccueil(dossier) {
  const liste = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? liste(path.join(d, e.name)) : [path.join(d, e.name)]);
  const candidats = liste(dossier).filter((f) => path.basename(f) === 'index.html')
    .sort((a, b) => a.split(path.sep).length - b.split(path.sep).length);
  if (!candidats.length) throw new Error(`Aucun index.html dans ${dossier}`);
  return candidats[0];
}

async function visite(navigateur, url, appareil, options = {}) {
  const contexte = await navigateur.newContext({ ...APPAREILS[appareil], reducedMotion: options.reducedMotion || 'no-preference' });
  const page = await contexte.newPage();
  const erreurs = [];
  const echecs = [];
  const requetes = [];
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  page.on('pageerror', (e) => erreurs.push(String(e)));
  page.on('requestfailed', (r) => echecs.push(r.url()));
  page.on('requestfinished', (r) => requetes.push(r));

  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  const auChargement = await page.evaluate(() => ({
    classeAnim: document.documentElement.classList.contains('l2b-anim'),
    sectionsAnimees: document.querySelectorAll('.l2b-apparition').length,
    motsTitre: document.querySelectorAll('.l2b-mot').length
  }));
  await page.waitForTimeout(2500); // laisse le titre finir de se révéler
  let ecran = null;
  if (options.captures) {
    ecran = path.join(captures, `${options.nom}-${appareil}-premier-ecran.png`);
    await page.screenshot({ path: ecran });
  }

  // Défilement complet, pour déclencher toutes les apparitions et les compteurs.
  const compteurs = new Set();
  const hauteur = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < hauteur; y += Math.round(APPAREILS[appareil].viewport.height * 0.6)) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(250);
    (await page.$$eval('.l2b-compteur', (els) => els.map((e) => e.textContent.trim()))).forEach((t) => compteurs.add(t));
  }
  // Vue « en cours de défilement » : le fond étant fixe (il suit l'écran), c'est la vue
  // la plus fidèle ; dans la capture « page entière » il n'apparaît qu'en haut.
  let milieu = null;
  if (options.captures) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2 - window.innerHeight / 2));
    await page.waitForTimeout(1500);
    milieu = path.join(captures, `${options.nom}-${appareil}-milieu-de-page.png`);
    await page.screenshot({ path: milieu });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2000);

  const mesures = await page.evaluate(() => {
    const largeur = document.documentElement.clientWidth;
    const debordent = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > largeur + 1 && debordent.length < 8) {
        debordent.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} (droite à ${Math.round(r.right)} px)`);
      }
    });
    const h1 = document.querySelector('h1');
    return {
      largeurEcran: largeur,
      largeurPage: document.documentElement.scrollWidth,
      defilementHorizontal: document.documentElement.scrollWidth > largeur,
      elementsQuiDebordent: debordent,
      texte: document.body.innerText,
      images: [...document.images].map((i) => (i.getAttribute('src') || '') + ' ' + (i.getAttribute('srcset') || '')),
      contacts: [...document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]')].map((a) => a.getAttribute('href')),
      restesAnimation: document.querySelectorAll('.l2b-apparition, .l2b-mot, .l2b-compteur').length,
      opaciteTitre: h1 ? getComputedStyle(h1).opacity : null,
      policeTitre: h1 ? getComputedStyle(h1).fontFamily : null,
      policeTexte: getComputedStyle(document.body).fontFamily
    };
  });

  let pageEntiere = null;
  if (options.captures) {
    pageEntiere = path.join(captures, `${options.nom}-${appareil}-page-entiere.jpg`);
    await page.screenshot({ path: pageEntiere, fullPage: true, type: 'jpeg', quality: 72 });
  }
  await page.waitForTimeout(500);
  let octets = 0;
  for (const r of requetes) octets += (await r.sizes()).responseBodySize;
  await contexte.close();
  return { url, appareil, auChargement, compteursVus: [...compteurs], ...mesures, erreurs, echecs, octets, ecran, milieu, pageEntiere };
}

(async () => {
  fs.mkdirSync(captures, { recursive: true });
  // Le serveur sert le dossier parent commun aux deux copies.
  let racineServeur = original;
  while (path.relative(racineServeur, essai).startsWith('..')) racineServeur = path.dirname(racineServeur);
  const serveur = await lanceServeur(racineServeur);
  const base = `http://127.0.0.1:${serveur.address().port}/`;
  const urlDe = (dossier) => base + path.relative(racineServeur, trouveAccueil(dossier)).split(path.sep).join('/');

  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  // Sinon Playwright envoie aussi les adresses locales (127.0.0.1) au proxy.
  process.env.PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK = '1';
  const navigateur = await chargePlaywright().chromium.launch(
    proxy ? { proxy: { server: proxy, bypass: '127.0.0.1,localhost' } } : {});

  const resultats = { date: new Date().toISOString(), pages: {} };
  for (const appareil of Object.keys(APPAREILS)) {
    const avant = await visite(navigateur, urlDe(original), appareil, { captures: true, nom: 'avant' });
    const apres = await visite(navigateur, urlDe(essai), appareil, { captures: true, nom: 'apres' });
    resultats.pages[appareil] = {
      avant, apres,
      textesIdentiques: avant.texte === apres.texte,
      imagesIdentiques: JSON.stringify(avant.images) === JSON.stringify(apres.images),
      contactsIdentiques: JSON.stringify(avant.contacts) === JSON.stringify(apres.contacts),
      nouvellesErreurs: apres.erreurs.filter((e) => !avant.erreurs.includes(e)),
      octetsAjoutes: apres.octets - avant.octets
    };
  }
  const reduit = await visite(navigateur, urlDe(essai), 'ordinateur', { reducedMotion: 'reduce' });
  resultats.mouvementReduit = {
    aucuneAnimationPreparee: !reduit.auChargement.classeAnim && reduit.auChargement.sectionsAnimees === 0 && reduit.auChargement.motsTitre === 0 && reduit.compteursVus.length === 0,
    ...reduit.auChargement,
    compteursVus: reduit.compteursVus
  };

  await navigateur.close();
  serveur.close();

  // Le texte complet n'est utile que pour la comparaison : on ne le garde pas dans le fichier.
  for (const p of Object.values(resultats.pages)) for (const v of [p.avant, p.apres]) delete v.texte;
  fs.writeFileSync(path.join(captures, 'resultats.json'), JSON.stringify(resultats, null, 2));

  for (const [appareil, p] of Object.entries(resultats.pages)) {
    console.log(`\n== ${appareil} (${p.apres.largeurEcran} px)`);
    console.log(`  défilement horizontal : avant ${p.avant.defilementHorizontal ? 'OUI' : 'non'} / après ${p.apres.defilementHorizontal ? 'OUI' : 'non'}`);
    if (p.apres.defilementHorizontal) console.log('  éléments qui débordent :', p.apres.elementsQuiDebordent);
    console.log(`  erreurs console : avant ${p.avant.erreurs.length} / après ${p.apres.erreurs.length} / nouvelles ${p.nouvellesErreurs.length}`);
    p.nouvellesErreurs.forEach((e) => console.log('    -', e));
    console.log(`  textes identiques : ${p.textesIdentiques} | images identiques : ${p.imagesIdentiques} | tél./e-mails identiques : ${p.contactsIdentiques}`);
    console.log(`  poids chargé : avant ${(p.avant.octets / 1024).toFixed(1)} Ko / après ${(p.apres.octets / 1024).toFixed(1)} Ko (+${(p.octetsAjoutes / 1024).toFixed(1)} Ko)`);
    console.log(`  animations : ${p.apres.auChargement.sectionsAnimees} sections, ${p.apres.auChargement.motsTitre} mots dans le titre, compteurs vus : ${p.apres.compteursVus.join(' | ') || 'aucun'}`);
    console.log(`  polices : titre = ${p.apres.policeTitre} | texte = ${p.apres.policeTexte}`);
  }
  console.log(`\n== mouvement réduit : ${resultats.mouvementReduit.aucuneAnimationPreparee ? 'respecté (aucune animation)' : 'PROBLÈME'}`);
  console.log(`\nCaptures et résultats dans ${path.relative(racine, captures) || '.'}/`);
})().catch((e) => { console.error(e); process.exit(1); });
