# Guide d’audit avant publication

## Principe
Les runners sont les HTML scientifiques existants auxquels une couche d’adaptation est ajoutée après leur code original. L’application parente ne recalcule pas les scores scientifiques : elle conserve les résultats renvoyés par les moteurs et fournit seulement une lecture rapide descriptive.

## Contrôles prioritaires
1. Comparer `source-snapshots/*.html` aux parties originales des `runners/*.html`. Le seul ajout attendu est le bloc `nb-runner-*` placé en fin de fichier.
2. Vérifier que les fonctions de protocole (`start*`, générateurs, timings, critères d’arrêt, scoring) sont inchangées.
3. Vérifier les 9 routes : CPT, MCST, Corsi, Empan, Stroop, Tapping (2 phases), Fitts, Steering, Dots.
4. Vérifier que le message `test-complete` ne part qu’après la fin effective de l’épreuve.
5. Vérifier que Tapping n’est finalisé qu’après régularité + vitesse.
6. Vérifier que `analysisProfile` agrégé contient seulement les métriques produites par les tests réellement passés.
7. Vérifier l’export après 1, 2 puis 9 tests.
8. Vérifier l’absence de `localStorage`, `sessionStorage`, IndexedDB et cookies applicatifs.
9. Vérifier F5/fermeture : alerte native lorsqu’au moins un test est terminé, puis remise à zéro après rechargement confirmé.
10. Tester Chrome/Edge en HTTPS. Tester Safari séparément pour synthèse vocale et `beforeunload`.

## Limites volontaires de cette V1
- pas de compte ;
- pas de backend ;
- pas de reprise après rechargement ;
- pas de diagnostic automatique ;
- lecture parent volontairement minimale ;
- données détaillées conservées dans le JSON cumulatif.

## Point spécifique V1.1 — Steering 6.3
Vérifier que la seule modification de protocole par rapport à Visuomotricité 6.2 concerne Steering : largeurs 28/18/12/7 px CSS, consigne vitesse-précision, quality gate. Fitts, Dots et tout le moteur Tapping doivent rester inchangés.


## Point spécifique V1.3 — functionalAnalysis

À auditer séparément des moteurs d’épreuves. La V1.3 n’altère aucun protocole de passation ; elle calcule des contrastes après réception des résultats.

Vérifier en particulier :
1. que les métriques dérivées reproduisent exactement les formules documentées dans `app.js` ;
2. que `referencePositions` ne calcule un z que si `comparable=true`, moyenne et ET présents ;
3. qu’aucun seuil d’affichage des observations n’est présenté comme clinique ;
4. que les quality flags excluent bien les mesures non interprétables ;
5. que les recommandations sont formulées comme essais d’aménagement et non prescriptions ;
6. que `functionalAnalysis` est recalculé après chaque test et inclus dans le JSON cumulatif.


## Import JSON — points à auditer

- Vérifier qu’un JSON V1.0/V1.1/V1.2/V1.3 contenant `tests` est accepté.
- Vérifier qu’une séance importée ne touche ni `localStorage`, ni `sessionStorage`, ni IndexedDB, ni cookies.
- Vérifier que seules les 9 clés de test reconnues sont chargées.
- Vérifier que `analysisProfile` et `functionalAnalysis` sont recalculés localement avec le code courant.
- Vérifier qu’un fichier non JSON, un JSON sans `tests`, ou un âge différent de 10 ans est rejeté proprement.
- Vérifier qu’un import avec une séance déjà en mémoire demande confirmation avant remplacement.
