# Run #010 — implementation-frontend-reinforcements

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (Finalisation de la feature renforts)
- **Spec source** : `docs/gameplay/04-combat.md` § Renforts entre ses propres villages
- **Type** : `feature`
- **Modules backend** : — (déjà prêt via #33)
- **Modules frontend** : 
    - `battleforthecrown-pixi/src/features/combat` (AttackDetailModal, ExpeditionList)
    - `battleforthecrown-pixi/src/features/army` (ArmyScreen, UnitList)
    - `battleforthecrown-pixi/src/api` (queries.ts, ws-bindings.ts)
    - `battleforthecrown-pixi/src/lib/types.ts`
- **Modules transverses** : `packages/shared/src/events/schemas.ts`, `packages/shared/src/combat/dtos.ts`

## Dépendances

- Run #33 (Backend renforts) terminé et validé.

## Critère de fin (acceptance)

- [ ] Le panneau d'envoi d'armée affiche un bouton « Renforcer » uniquement si le village cible appartient au joueur.
- [ ] Les expéditions de type REINFORCE sont affichées sur la carte du monde avec une distinction visuelle (couleur ou icône).
- [ ] L'écran Armée possède une section ou un onglet « Garnison » qui liste les troupes étrangères actuellement stationnées dans le village.
- [ ] Les actions « Rappeler » (depuis le village d'origine) et « Renvoyer » (depuis le village hôte) sont opérationnelles pour les unités en garnison.
- [ ] L'interface se met à jour en temps réel via WebSocket lors de l'envoi, du rappel et du retour des renforts (événements outbox `reinforcement.sent`, `reinforcement.recalled`, `reinforcement.returned`).

## Règles à respecter

- Tests : @.agents/rules/tests.md
- QA : @.agents/rules/qa.md
- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

- T1 — Rédiger la documentation d'implémentation technique frontend (Pixi/React).
- T2 — Mettre à jour `api/queries.ts` et `lib/types.ts` avec les endpoints REST et types liés aux renforts (inventaire de garnison, mutations).
- T3 — Mettre à jour `ws-bindings.ts` pour gérer le cycle de vie des expéditions de renfort via les événements Outbox.
- T4 — Refactoriser `AttackDetailModal.tsx` pour inclure l'action d'envoi de type REINFORCE (renommer potentiellement en `SendArmyModal.tsx`).
- T5 — Ajouter la section/onglet "Garnison" dans `ArmyScreen.tsx` et implémenter les boutons Rappeler / Renvoyer.
- T6 — Adapter la vue de la carte (mini-carte, lignes de trajet) et `ExpeditionList` pour différencier visuellement REINFORCE des attaques.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, QA résiduelle qui revient à toi, méta-évaluation si applicable.)_
