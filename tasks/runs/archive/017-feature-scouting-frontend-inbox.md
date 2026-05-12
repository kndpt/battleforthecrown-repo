# Run #017 — feature-scouting-frontend-inbox

> **Statut** : DONE
> **Démarré** : 2026-05-12
> **Terminé** : 2026-05-12

## Cible

- **Phase roadmap** : Phase 4 — Scouting
- **Spec source** : [`docs/gameplay/11-scouting.md`](../../docs/gameplay/11-scouting.md)
- **Type** : `feature`
- **Modules backend** : `—`
- **Modules frontend** : `pixi/api`, `pixi/features/combat`, `pixi/features/reports`

## Dépendances

- Run [`016`](./016-feature-scouting-backend-shared.md) terminé : contrat `ScoutReport`, endpoint d'envoi scout, retour ESPION, invalidations inbox et smokes backend validés.
- Décision produit : bouton `Scout` dans le flow cible/attaque existant.
- Décision produit : coût mission limité à l'ESPION engagé + temps de trajet, sans coût couronnes MVP.
- Décision produit : rapport scout affiché dans l'inbox, avec état lu/non-lu et suppression comme les rapports combat.

## Critère de fin (acceptance)

- [x] Depuis le flow cible/attaque existant, le joueur voit une action `Scout` quand la cible est valide.
- [x] L'action `Scout` permet de choisir uniquement des ESPION(s) et bloque les autres unités.
- [x] L'UI expose le coût réel MVP : ESPION(s) engagés + temps de trajet, aucun coût couronnes.
- [x] Le joueur peut envoyer un scout vers un village barbare visible.
- [x] Le joueur peut envoyer un scout vers un village joueur visible.
- [x] Les rapports scout apparaissent dans l'inbox sans casser les rapports combat existants.
- [x] Le rapport scout affiche composition d'armée, stock de ressources et style stratégique si applicable.
- [x] Le style d'un village joueur ennemi n'est visible côté UI qu'à travers le rapport scout.
- [x] Lu/non-lu et suppression fonctionnent pour les rapports scout.
- [x] `yarn static-check` et les tests Pixi ciblés sont verts.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- API Pixi : ajouter queries/mutations `ScoutReport` + envoi `/combat/scout`; succès = endpoints backend run 016 consommés côté front.
- Flow cible/attaque : ajouter mode `Scout` SPY-only dans `AttackDetailModal`; succès = sélection limitée aux ESPIONs, coût 0 couronnes + temps de trajet.
- Inbox : remplacer le rendu liste par `InboxTabs`/`MailInboxItem` adapté du design system; succès = rapports combat et scout triés ensemble, filtre Tous/Combats/Scouts.
- Détail rapport : adapter `ScoutReportCard` design aux données réelles; succès = unités, ressources et style stratégique affichés depuis le snapshot backend.
- Tests : couvrir mappings scout et invalidation unread; succès = tests ciblés + `yarn static-check` verts.

## Progress (rempli pendant le run)

- Préflight : Git clean, fiche `PLANNED`, règles/spec/briefing Pixi lus.
- Cartographie : backend run 016 expose `/combat/scout`, `/combat/scout-reports`, read/delete séparés; inbox Pixi existante était combat-only.
- Implémentation : action `Scout`, queries scout, inbox mixte, détail `ScoutReportCard`, unread scout.
- Tests : `scoutReportView.test.ts` ajouté; `ws-bindings.test.ts` étendu.
- Vérification : tests ciblés Pixi, type-check Pixi, lint Pixi, puis `yarn static-check` racine verts.

## Décisions prises

- Le style stratégique ennemi reste absent des listes/carte et n'est rendu que dans le détail `ScoutReportCard` alimenté par `ScoutReport.strategy`.
- L'inbox utilise les composants design `InboxTabs`/`MailInboxItem` pour le front réel, avec filtres réduits aux types réellement branchés MVP.
- Pas de backend touché : smokes backend non applicables à ce run frontend.

## Rapport final

Run livré côté Pixi : le flow cible/attaque propose `Scout` sur villages barbares/joueurs ennemis visibles, limite la sélection aux ESPIONs, affiche coût mission + temps de trajet sans couronnes, et envoie `/combat/scout`. L'inbox affiche désormais rapports combat + scout via le composant design de boîte du seigneur (`InboxTabs`/`MailInboxItem`) et ouvre un détail scout basé sur `ScoutReportCard` adapté au contrat backend.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Bouton `Scout` disponible dans le flow cible/attaque existant — preuve : `AttackDetailModal` affiche le segment Scout pour cible `PLAYER_VILLAGE`/`BARBARIAN_VILLAGE` non alliée.
  - [x] Sélection SPY-only et coût sans couronnes — preuve : `AttackDetailModal` filtre `heldUnits` à `UNIT_TYPES.SPY` en mode scout et affiche `Coût couronnes : 0`.
  - [x] Rapport scout rendu dans l'inbox — preuve : `ReportsList` fusionne `useCombatReportsQuery` + `useScoutReportsQuery` et rend les scouts via `MailInboxItem`.
  - [x] Lu/non-lu et suppression sur rapport scout — preuve : `ReportDetailModal` appelle `useMarkScoutReportReadMutation` à l'ouverture et `useDeleteScoutReportMutation` sur suppression.
  - [x] Aucun leak du style joueur hors rapport scout — preuve : `ScoutReport.strategy` est seulement consommé dans `buildScoutReportCardProps`, pas dans la carte monde ni la liste inbox.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-pixi test src/features/combat/scoutReportView.test.ts src/api/ws-bindings.test.ts` — vert, 2 files / 16 tests.
  - `rtk yarn workspace battleforthecrown-pixi type-check` — vert.
  - `rtk yarn workspace battleforthecrown-pixi lint:check --quiet` — vert (warning externe baseline affiché hors static-check).
  - `rtk yarn static-check` — vert.
- **Smokes lancés** : Non applicable, raison : aucun fichier `battleforthecrown-backend/src/` modifié.
- **Smokes ajoutés/modifiés** : Aucun, raison : run frontend sans orchestration backend nouvelle.
- **QA fonctionnelle agent** : Non exécuté, raison : scénario IG complet nécessite session authentifiée + monde peuplé dans navigateur ; la couche backend a été validée par run 016 et ce run vérifie le branchement frontend par tests/types/lint.
- **Tests IG à faire par le user** :
  - [ ] Depuis une cible barbare visible, ouvrir la modale, passer sur `Scout`, sélectionner 1+ ESPION, vérifier coût `0` couronnes et envoyer.
  - [ ] Répéter sur un village joueur visible.
  - [ ] À réception, ouvrir l'inbox et vérifier le rendu scout + détail unités/ressources/style.
