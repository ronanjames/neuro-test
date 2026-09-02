# Batterie web — V1.3

Application statique qui encapsule les versions actuelles :
- batterie-attention-v4.html : CPT + MCST
- batterie-neuro-v4.html : Corsi + Empan auditif + Stroop + Tapping régularité/vitesse
- batterie-visuomotrice-v6.3.html : Fitts souris + Steering + Dots

## Fonctionnement
- 9 cartes de tests.
- Résultats conservés uniquement dans l'objet JavaScript de la page parente.
- Aucun localStorage, sessionStorage, cookie ou backend.
- F5/fermeture = perte des résultats après alerte native `beforeunload`.
- Export JSON cumulatif à tout moment.
- Chaque runner est un moteur existant auquel un adaptateur `postMessage` a été ajouté ; les protocoles/scorings internes ne sont pas réécrits par l'application parente.
- Tapping est présenté comme une seule épreuve en deux phases : régularité puis vitesse.

## Tester localement
Éviter l'aperçu ChatGPT pour les tests chronométrés. Depuis ce dossier :

    python3 -m http.server 8080

Puis ouvrir http://localhost:8080 dans Chrome/Edge.

## Publier
Le dossier peut être déployé tel quel sur un hébergement statique HTTPS (Netlify, Cloudflare Pages, GitHub Pages). Aucun build n'est nécessaire.

## Audit recommandé
Avant publication, vérifier dans chaque runner :
1. timings et nombres d'essais ;
2. générateurs de séquences / formes ;
3. critères d'arrêt ;
4. unités et références ;
5. comportement Chrome/Edge/Safari ;
6. perte de focus et interruptions ;
7. export cumulatif après chacun des 9 tests.

## Modification V1.1 / Steering 6.3
- Tapping inchangé.
- Steering : 28 / 18 / 12 / 7 px CSS, 3 passages par largeur.
- Consigne : aussi vite que possible sans sortir.
- Quality gate interne : pente positive et R² >= 0,30 ; si non validé, IP neutralisé et résultat marqué non interprétable. Ce quality gate n'est ni une norme ni un seuil clinique.


## V1.3 — analyse fonctionnelle locale

La V1.3 ajoute un bloc `functionalAnalysis` calculé intégralement dans le navigateur. Il ne remplace pas `analysisProfile` et ne produit ni diagnostic ni score global.

Calculs dérivés actuellement exportés (jusqu’à 16 selon les épreuves disponibles) :
- CPT : coût d’attente 4 s vs 1 s, coût relatif, ratio de variabilité, évolution tardive RT et CV ;
- Dots : coût local de switch RT et exactitude, inhibition stable, asymétrie de switch selon la règle ;
- MCST : coût temporel après changement et erreurs immédiatement post-changement ;
- Stroop : interférence relative, coût d’erreur, amplitude du gradient orthographique ;
- Corsi : coût direct–inverse ;
- Empan de chiffres : coût direct–inverse + contraste sur score continu.

`functionalAnalysis.referencePositions` calcule aussi des z descriptifs uniquement pour les métriques dont `analysisProfile.reference.comparable === true` et qui disposent d’une moyenne et d’un écart-type. Le seuil ±1,5 ET sert à décrire la position par rapport au repère, jamais comme seuil clinique.

`functionalAnalysis.observations` contient des règles déterministes prudentes. Les seuils internes servent seulement à éviter l’affichage de petits écarts probablement bruités ; ils sont documentés comme heuristiques et non comme seuils scientifiques/diagnostiques.

Les pistes sont stockées dans `functionalAnalysis.adjustmentsToTry` sous la forme « à essayer / observer si cela aide ».


## Importer une séance JSON

Le bouton **Importer un JSON** recharge en mémoire une séance exportée par les versions Web 1.0 à 1.3. L’import :

- remplace la séance actuellement en mémoire après confirmation ;
- conserve les données brutes et les essais individuels ;
- reconnaît uniquement les 9 épreuves de la batterie ;
- reconstruit `analysisProfile` depuis les résultats importés ;
- recalcule `functionalAnalysis` avec le moteur de la version courante ;
- conserve dans `importedFrom` le nom du fichier et la version d’origine pour la traçabilité ;
- ne persiste toujours rien dans le navigateur après actualisation.

Cette fonction est notamment utile pour rouvrir une ancienne passation, inspecter une séquence d’essais ou bénéficier de nouveaux calculs sans repasser les tests.
