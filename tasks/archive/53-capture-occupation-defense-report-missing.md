# 53 — Rapport défenseur manquant quand une capture est attaquée

**Sévérité** : 🔴 Haute  
**Statut** : ✅ Résolu 2026-05-13 par `$run @tasks/53-capture-occupation-defense-report-missing.md`
**Décision gameplay** : attaquer un village sous capture doit produire un rapport lisible pour le joueur qui occupe la cible, comme s'il défendait une attaque.

## Symptôme

Pendant une fenêtre de capture, les troupes survivantes + le Seigneur sont stationnés en garnison d'occupation sur le village cible.

Cas observé :

- joueur A capture un village ;
- joueur A attaque ensuite ce même village avec une autre troupe ;
- l'attaque détruit la garnison d'occupation ;
- la capture est annulée, probablement parce que le Seigneur est mort ;
- aucun rapport n'explique au joueur A que sa garnison de capture a été attaquée/détruite.

Même problème attendu si un autre joueur attaque la cible sous capture : le propriétaire de l'occupation doit voir le combat subi par ses troupes et son Seigneur.

## Root cause probable

Le combat contre un village barbare sous capture inclut les `Garrison` dans la défense, mais le `CombatReport` semble encore raisonner avec :

- `attackerUserId` = joueur qui lance l'attaque ;
- `defenderUserId` = propriétaire du village cible si `PLAYER_VILLAGE` ;
- pas de participant défenseur quand la cible est `BARBARIAN_VILLAGE` + garnison d'occupation.

Résultat : les pertes de la garnison peuvent interrompre la capture, mais le joueur occupant n'a pas de rapport participant côté défense.

## Objectif

Faire de la garnison d'occupation un vrai participant de rapport.

Le joueur qui possède `PendingConquest.attackerUserId` doit recevoir un rapport défenseur quand sa garnison d'occupation est impliquée dans un combat sur le village cible.

## Points à analyser

- `CombatWorker.buildBarbarianDefender(...)` : participants de défense venant de `garrison`.
- `CombatWorker.applyDefenderLosses(...)` : interruption capture si Seigneur mort ou escorte détruite.
- Création `CombatReport` : modèle actuel mono `defenderUserId` probablement insuffisant pour une cible barbare avec garnison joueur.
- Inbox / lecture / suppression : vérifier si `readByDefender` suffit ou s'il faut un modèle multi-participant.
- Cas self-attack : si l'attaquant est aussi l'occupant, éviter un rapport dupliqué illisible, mais conserver l'information que la capture a été défendue/perdue.

## Scope attendu

### Backend

- Identifier les participants défenseurs issus de la garnison d'occupation.
- Créer ou exposer un rapport pour le propriétaire de l'occupation quand ses troupes défendent.
- Le rapport doit montrer :
  - attaquant ;
  - cible sous capture ;
  - pertes de la garnison d'occupation ;
  - mort éventuelle du Seigneur ;
  - interruption de capture si applicable.
- Garder l'asymétrie existante des rapports barbares hors occupation.

### Realtime / Inbox

- Invalider l'inbox du joueur occupant quand le rapport est créé.
- S'assurer que le badge messages bouge pour le bon joueur.

### Tests

- Smoke : A ouvre une capture, B attaque la cible, la garnison de A meurt, A reçoit un rapport défenseur + capture interrompue.
- Smoke ou test ciblé : A attaque sa propre cible sous capture avec une autre troupe, la capture est interrompue, A reçoit une trace lisible sans doublon confus.
- Vérifier que les raids barbares classiques ne créent pas de rapport défenseur artificiel.

## Critères de succès

- Une capture interrompue par combat laisse toujours une trace inbox pour l'occupant.
- Le joueur comprend pourquoi son Seigneur/capture a disparu.
- Les rapports existants attaquant/défenseur PvP ne régressent pas.
- Les smokes conquête + inbox restent verts.
- `yarn static-check` vert.
