# Rapport — version de test du site L2B ENERGIES

> **⚠️ Rapport d'étape (10/10/2026) : le travail n'est pas terminé.**
> L'environnement de travail n'a pas le droit d'accéder à `www.l2b-energies.fr` :
> la politique réseau bloque ce site (erreur 403). Résultat : le site n'a pas pu
> être récupéré, donc **pas encore de dossier `original/`, `essai/` ni de captures du vrai site**.
> Tout le reste est prêt et testé. Dès que l'accès est ouvert, il reste 3 commandes à lancer
> (voir « Pour terminer » en bas).

## 1. Ce qui change (le « calque » visuel, dans `calque/`)

Présentation uniquement. Aucun texte, aucune photo, aucune coordonnée n'est modifié.

**Fond SVG en vagues et formes douces** (`l2b-fond.svg`, 1,8 Ko), écrit à la main dans le style Haikei :
- 3 vagues superposées en bas de l'écran (vert #5FB562, vert vif #499401, vert foncé #013927, transparentes) ;
- 2 formes organiques discrètes (en haut à droite, à gauche à mi-hauteur) ;
- fond crème #F5FFFA ;
- le fond est « fixe » : il suit l'écran pendant qu'on fait défiler la page.

**Animations douces** (`l2b-essai.js` + `l2b-essai.css`), dans l'esprit de Motion Primitives, en JavaScript simple sans framework :
- **titre principal** : les mots apparaissent un par un, en sortant d'un léger flou ;
- **sections** : elles montent légèrement et sortent du flou quand on arrive dessus en défilant. Ce qui est visible au chargement ne bouge pas, pour éviter tout clignotement ;
- **compteurs** : un chiffre déjà présent sur le site monte de 0 jusqu'à sa valeur, puis le texte d'origine est remis exactement. Le script ne crée aucun chiffre. Il ne reconnaît que ceux accompagnés d'une unité (kWc, ans, années, installations…). Il ignore volontairement les années (« depuis 2008 »), les codes postaux et les numéros de téléphone ;
- **« moins de mouvement »** : si le visiteur l'a activé sur son téléphone ou son ordinateur, aucune animation ne se lance.

**Polices de la charte** : Poppins pour les titres, Comfortaa pour le texte. Elles sont hébergées avec le site, donc il n'y a pas d'appel aux serveurs de Google (plus simple pour le RGPD). Licence libre OFL, jointe dans `calque/polices/`.

## 2. Poids ajouté

| Fichier | Taille | Compressé (gzip) |
|---|---:|---:|
| Fond SVG | 1,8 Ko | 0,9 Ko |
| Styles CSS | 3,6 Ko | 1,4 Ko |
| Animations JS | 7,6 Ko | 2,9 Ko |
| Poppins 600 + 700 | 15,4 Ko | (déjà compressées) |
| Comfortaa 400 + 700 | 26,4 Ko | (déjà compressées) |
| Lignes ajoutées dans chaque page HTML | 0,35 Ko | — |
| **Total maximum** | **≈ 55 Ko** | **≈ 47 Ko** |

Le navigateur ne charge que les polices réellement utilisées sur la page.
Sur la page de test : **+47,4 Ko** mesurés au chargement. Le chiffre réel pour le site L2B
sera mesuré automatiquement par l'étape 3. Si le site charge déjà Poppins et Comfortaa,
on pourra retirer nos copies et gagner jusqu'à 42 Ko.

## 3. Vérifications

Le script `outils/3-verifier-et-capturer.cjs` contrôle automatiquement, sur téléphone (375 px) et ordinateur (1440 px) :
défilement horizontal, erreurs dans la console, poids ajouté, textes / photos / téléphones / e-mails
identiques à l'original, et respect du « moins de mouvement ».

**Testé pour l'instant sur une page de test neutre seulement (pas sur le site L2B)** :

| Contrôle | Téléphone 375 px | Ordinateur 1440 px |
|---|---|---|
| Défilement horizontal | aucun | aucun |
| Nouvelles erreurs console | 0 | 0 |
| Textes, photos, coordonnées identiques | oui | oui |
| « Moins de mouvement » respecté | — | oui |

Ces résultats prouvent que les outils marchent. Ils ne remplacent pas le test sur le vrai site.

## 4. Captures

**Pas encore faites** : elles demandent le vrai site.
L'étape 3 les rangera dans `captures/`, en version avant / après, sur téléphone et ordinateur :
- `…-premier-ecran.png` : ce qu'on voit en arrivant sur la page ;
- `…-milieu-de-page.png` : la page en cours de défilement. C'est la vue la plus fidèle pour le fond ;
- `…-page-entiere.jpg` : toute la page. Attention : le fond étant fixe, il n'apparaît qu'en haut sur cette capture. Ce n'est pas un bug du site.

## 5. Points à surveiller sur le vrai site

- **Fond peu visible** : si les sections du site ont un fond blanc plein, elles cachent nos vagues. Il faudra alors rendre certaines sections transparentes (réglage dans `calque/l2b-essai.css`).
- **Comfortaa est plus large** que la plupart des polices. Certains titres ou chiffres peuvent passer sur 2 lignes. À vérifier sur les captures téléphone.
- **Animations déjà présentes** : si le site a déjà ses propres animations (WordPress/Elementor, par exemple), il faudra éviter les doublons. Les réglages sont en haut de `calque/l2b-essai.js`.

## 6. Trois idées à essayer ensuite

1. **Vagues de transition entre les sections.** Au lieu du seul fond fixe, une vague SVG ferait la jonction entre deux sections de couleurs différentes (par exemple au-dessus du pied de page vert foncé). Effet « Haikei » plus marqué, quelques centaines d'octets.
2. **Cartes de services en cascade et survol vivant.** Les blocs (pompe à chaleur, solaire, climatisation…) apparaîtraient l'un après l'autre, comme le « groupe animé » de Motion Primitives. Au survol de la souris, ils se soulèveraient légèrement avec une ombre verte.
3. **Bandeau défilant des labels.** Si des certifications (RGE, QualiPAC, QualiPV…) ou des logos partenaires sont **déjà** sur le site, ils pourraient défiler lentement dans un bandeau, comme l'« Infinite Slider » de Motion Primitives. Le bandeau s'arrêterait au survol, et resterait immobile en mode « moins de mouvement ».

## Pour terminer

1. **Ouvrir l'accès au site** : dans les réglages de l'environnement cloud (menu de l'environnement dans la barre de titre de la session, puis *Edit* → *Network access*), ajouter `l2b-energies.fr` et `www.l2b-energies.fr` aux *Allowed domains*, en laissant cochée la case *Allow package managers*. Mode d'emploi : https://code.claude.com/docs/en/cloud-environments#network-access
2. Me redemander de **continuer la version de test**. Je lancerai alors les 3 étapes, j'ajusterai le calque au vrai site, puis je compléterai ce rapport avec les captures et les vrais chiffres.
