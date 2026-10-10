/* ==========================================================================
   L2B ENERGIES — animations douces de la version de test (sans framework)
   - les sections apparaissent au défilement ;
   - le titre principal se révèle mot par mot ;
   - les chiffres déjà présents sur le site (kWc, années…) montent jusqu'à
     leur valeur, puis le texte d'origine est remis à l'identique.
   Rien ne bouge si le visiteur a demandé « moins de mouvement ».
   ========================================================================== */
(function () {
  'use strict';

  // Réglages à ajuster une fois la structure du vrai site connue.
  var REGLAGES = {
    titre: 'h1',
    sections: 'main > section, body > section, .elementor-top-section, .wp-block-group, .wp-block-cover, main article, footer',
    // Mots qui signalent un compteur, dans le chiffre lui-même ou juste à côté.
    unites: /kwc|mwc|\bkw\b|\bans?\b|ann[ée]es?|exp[ée]rience|installations?|clients?|chantiers?|panneaux|pompes?|projets?|%/i,
    // Zones où un chiffre n'est jamais un compteur (téléphone, adresse, formulaires…).
    exclus: 'script, style, noscript, a[href^="tel:"], address, form, select, option, time, [itemprop="telephone"], [itemprop="postalCode"]',
    dureeCompteur: 1600
  };

  var html = document.documentElement;
  var mouvementReduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (mouvementReduit || !('IntersectionObserver' in window)) {
    html.classList.remove('l2b-anim');
    return;
  }

  function demarrer() {
    reveleTitre();
    prepareSections();
    prepareCompteurs();
  }

  /* ---------- Titre principal ---------- */
  function reveleTitre() {
    var titres = document.querySelectorAll(REGLAGES.titre);
    var titre = titres[0];
    var nbMots = 0;
    if (titre && titre.textContent.trim()) {
      nbMots = decoupeEnMots(titre);
      // Une fois l'animation finie, on remet le titre exactement comme avant.
      setTimeout(function () { recolle(titre); }, nbMots * 70 + 120 + 800);
    }
    for (var i = 0; i < titres.length; i++) titres[i].classList.add('l2b-titre-pret');
  }

  function decoupeEnMots(el) {
    var parcours = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var noeuds = [];
    while (parcours.nextNode()) noeuds.push(parcours.currentNode);
    var n = 0;
    noeuds.forEach(function (noeud) {
      var morceaux = noeud.nodeValue.split(/(\s+)/);
      var fragment = document.createDocumentFragment();
      morceaux.forEach(function (m) {
        if (!m) return;
        if (/^\s+$/.test(m)) {
          fragment.appendChild(document.createTextNode(m));
          return;
        }
        var mot = document.createElement('span');
        mot.className = 'l2b-mot';
        mot.style.setProperty('--i', n++);
        mot.textContent = m;
        fragment.appendChild(mot);
      });
      noeud.parentNode.replaceChild(fragment, noeud);
    });
    return n;
  }

  function recolle(el) {
    var mots = el.querySelectorAll('.l2b-mot');
    for (var i = 0; i < mots.length; i++) {
      mots[i].parentNode.replaceChild(document.createTextNode(mots[i].textContent), mots[i]);
    }
    el.normalize();
  }

  /* ---------- Sections au défilement ---------- */
  function prepareSections() {
    var toutes = Array.prototype.slice.call(document.querySelectorAll(REGLAGES.sections));
    var hauteurEcran = window.innerHeight;
    var aRevele = toutes.filter(function (el) {
      // On ne garde que le niveau le plus haut (pas de section dans une section).
      if (el.parentElement && el.parentElement.closest(REGLAGES.sections)) return false;
      var position = getComputedStyle(el).position;
      if (position === 'fixed' || position === 'sticky') return false;
      var cadre = el.getBoundingClientRect();
      // Ce qui est déjà à l'écran au chargement reste tel quel (pas de clignotement).
      return cadre.height > 0 && cadre.top > hauteurEcran * 0.9;
    });
    if (!aRevele.length) return;

    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (!entree.isIntersecting) return;
        var el = entree.target;
        observateur.unobserve(el);
        el.classList.add('l2b-visible');
        // Après l'animation, on retire nos classes : la section redevient l'originale.
        setTimeout(function () {
          el.classList.remove('l2b-apparition', 'l2b-visible');
        }, 900);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    aRevele.forEach(function (el) {
      el.classList.add('l2b-apparition');
      observateur.observe(el);
    });
  }

  /* ---------- Compteurs ---------- */
  // Texte complet = [préfixe court] nombre [,décimales] [suffixe court]
  var FORME_NOMBRE = /^(\D{0,14}?)(\d{1,3}(?:[   .]\d{3})+|\d+)(?:,(\d+))?(\D{0,40})$/;

  function prepareCompteurs() {
    var elements = document.body.getElementsByTagName('*');
    var compteurs = [];
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.childElementCount !== 0 || el.closest(REGLAGES.exclus)) continue;
      var texte = el.textContent.trim();
      if (!texte || texte.length > 50) continue;
      var m = FORME_NOMBRE.exec(texte);
      if (!m) continue;
      var valeur = parseFloat(m[2].replace(/\D/g, '') + (m[3] ? '.' + m[3] : ''));
      if (!(valeur >= 5)) continue;
      var avecUnite = REGLAGES.unites.test(m[1] + m[4]);
      // Une année (2008) ou un code postal (69000) sans unité n'est pas un compteur.
      if (!avecUnite && /^(19|20)\d\d$|^\d{5}$/.test(m[2])) continue;
      if (!avecUnite && !REGLAGES.unites.test(texteVoisin(el))) continue;
      compteurs.push({ el: el, texte: el.textContent, m: m, valeur: valeur });
    }
    if (!compteurs.length) return;

    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (!entree.isIntersecting) return;
        observateur.unobserve(entree.target);
        compteurs.forEach(function (c) { if (c.el === entree.target) anime(c); });
      });
    }, { threshold: 0.6 });
    compteurs.forEach(function (c) { observateur.observe(c.el); });
  }

  function texteVoisin(el) {
    var parent = el.parentElement;
    var texte = parent ? parent.textContent : '';
    if (parent && texte.trim().length < 30 && parent.parentElement) texte = parent.parentElement.textContent;
    return texte.length > 160 ? '' : texte;
  }

  function anime(c) {
    var m = c.m;
    var debut = c.texte.slice(0, c.texte.indexOf(m[0]));
    var fin = c.texte.slice(c.texte.indexOf(m[0]) + m[0].length);
    var separateur = (m[2].match(/[   .]/) || [''])[0];
    var decimales = m[3] ? m[3].length : 0;
    var depart = null;
    c.el.classList.add('l2b-compteur');

    function ecris(nombre) {
      var parties = nombre.toFixed(decimales).split('.');
      var entier = parties[0].replace(/\B(?=(\d{3})+(?!\d))/g, separateur);
      c.el.textContent = debut + m[1] + entier + (decimales ? ',' + parties[1] : '') + m[4] + fin;
    }
    function image(t) {
      if (depart === null) depart = t;
      var avance = Math.min((t - depart) / REGLAGES.dureeCompteur, 1);
      var adouci = 1 - Math.pow(1 - avance, 3);
      if (avance < 1) {
        ecris(c.valeur * adouci);
        requestAnimationFrame(image);
      } else {
        c.el.textContent = c.texte; // texte d'origine, à l'identique
        c.el.classList.remove('l2b-compteur');
      }
    }
    ecris(0);
    requestAnimationFrame(image);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
})();
