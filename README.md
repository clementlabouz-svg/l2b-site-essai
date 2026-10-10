# l2b-site-essai

Version de **test** du site vitrine de L2B ENERGIES, plus vivante.
Le site en ligne n'est jamais modifié : on travaille sur une copie locale.

## Ce que contient le dépôt

| Dossier | Rôle |
|---|---|
| `original/` | Copie du site en ligne, **intacte** (référence). Créée par l'étape 1. |
| `essai/` | Copie de `original/` + le calque visuel. Créée par l'étape 2. |
| `calque/` | Le calque visuel lui-même : fond SVG, styles, animations, polices. **C'est ici qu'on modifie.** |
| `outils/` | Les 3 étapes, à lancer dans l'ordre. |
| `captures/` | Captures avant / après + `resultats.json`. Créées par l'étape 3. |
| `RAPPORT.md` | Ce qui a changé, le poids ajouté, les captures, les idées suivantes. |

## Les 3 étapes

```bash
bash outils/1-recuperer-original.sh        # télécharge www.l2b-energies.fr dans original/
node outils/2-construire-essai.cjs         # fabrique essai/ = original/ + calque/
node outils/3-verifier-et-capturer.cjs     # vérifie (375 px / 1440 px) et fait les captures
```

Pour regarder la version d'essai dans un navigateur : `npx serve .` puis ouvrir
`essai/www.l2b-energies.fr/index.html`.

## Règles du calque

- Présentation uniquement : textes, photos et coordonnées restent identiques
  (l'étape 3 le vérifie automatiquement).
- Polices hébergées avec le site (aucun appel à Google Fonts).
- Animations coupées si le visiteur a demandé « moins de mouvement » dans son système.
