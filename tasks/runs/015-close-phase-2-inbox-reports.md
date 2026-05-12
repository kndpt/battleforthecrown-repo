# Run #015 — close-phase-2-inbox-reports

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 2 — Inbox & rapports (cf. `tasks/00-mvp-roadmap.md`)
- **Spec source** : [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md) ; [`tasks/runs/archive/012-feature-inbox-combat-reports.md`](./archive/012-feature-inbox-combat-reports.md) ; [`docs/architecture/realtime.md`](../../docs/architecture/realtime.md)
- **Type** : `audit`
- **Modules backend** : `battleforthecrown-backend/src/modules/combat` ; `battleforthecrown-backend/src/modules/event` ; `battleforthecrown-backend/prisma/schema.prisma`
- **Modules frontend** : `battleforthecrown-pixi/src/features/combat` ; `battleforthecrown-pixi/src/api/queries.ts` ; `battleforthecrown-pixi/src/api/ws-bindings.ts`

## Dépendances

- Phase 1 close.
- Run [`012-feature-inbox-combat-reports`](./archive/012-feature-inbox-combat-reports.md) terminé et archivé.
- Contrat MVP Phase 2 déjà resserré sur les rapports de combat dans [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md).

## Critère de fin (acceptance)

- [ ] Le run `012` est relu comme source d'état réel Phase 2 et ses décisions sont comparées au code courant.
- [ ] Le code confirme REST reports, détail, read/delete par participant, unread badge et invalidation WS attaquant/défenseur.
- [ ] [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md) ne décrit plus un chantier ouvert incompatible avec l'état livré.
- [ ] [`tasks/00-mvp-roadmap.md`](../00-mvp-roadmap.md) indique clairement si la Phase 2 est close ou s'il reste un delta explicite.
- [ ] Si un écart fonctionnel réel est trouvé, il est corrigé ou ticketé précisément avec preuve.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [ ] Phase 2 vérifiée contre run `012`, spec, roadmap et code — preuve : <cartographie + diff éventuel>.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : tests bout-en-bout manuels exécutés par l'agent quand pertinent (`server + curl`, REST, WebSocket, worker/job, ou `SELECT` DB), avec résultat observable. Si non fait, `Non nécessaire` ou `Non exécuté` + raison précise.
- **Tests IG à faire par le user** : seulement ce qui demande une appréciation gameplay/visuelle, un vrai navigateur humain, ou un scénario trop coûteux à automatiser ; checklist observable. Sinon `Aucun test IG nécessaire`, raison.

## Points d'attention

- Ne pas refaire le run `012` : ce run est une clôture/validation delta de Phase 2.
- Ne pas introduire de table `Report` transverse sans écart réel : le contrat MVP actuel garde `CombatReport` comme source persistante.
- Scout, conquête détaillée, push deep-link, filtres, pin, archive et rétention automatique restent hors scope Phase 2 MVP sauf contradiction explicite trouvée pendant la cartographie.
- Si le run révèle un vrai manque produit non trivial, ouvrir un ticket ou proposer un second run ciblé plutôt que gonfler ce run de clôture.

## Notes

Ce run sert à aligner la roadmap et les docs avec l'état réel après le run `012`, puis à fermer proprement la Phase 2 si aucun delta fonctionnel bloquant n'est trouvé.
