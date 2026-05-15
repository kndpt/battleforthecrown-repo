# Run #026 — feature-daily-cards-oyez-backend-shared

> **Statut** : DONE
> **Démarré** : 2026-05-15
> **Terminé** : 2026-05-15

## Cible

- **Phase roadmap** : Phase 10 — Rétention quotidienne MVP
- **Spec source** : [`docs/gameplay/05-daily-cards-and-oyez.md`](../../../docs/gameplay/05-daily-cards-and-oyez.md), [`docs/gameplay/lab/mobile-retention-modernization.md`](../../../docs/gameplay/lab/mobile-retention-modernization.md) en anticipation non canonique, [`docs/gameplay/22-village-roles-and-navigation.md`](../../../docs/gameplay/22-village-roles-and-navigation.md) pour la cible de récompense
- **Type** : `feature`
- **Modules backend** : `prisma`, `gameplay`, `event`, `village`, `combat`
- **Modules frontend** : `—`

## Dépendances

- Phase 9 livrée par [`021-feature-village-labels-navigation`](./021-feature-village-labels-navigation.md) : une récompense qui cible un village doit demander un village possédé au claim et proposer par défaut le dernier village récompensé.
- Migrations Prisma non destructives uniquement. Aucun reset DB.
- Les events métier existants doivent rester la source de progression des tâches : pas de validation par clic UI.
- Le run frontend [`027-feature-daily-cards-oyez-frontend-hud`](../027-feature-daily-cards-oyez-frontend-hud.md) dépend de ce contrat API/shared.

## Critère de fin (acceptance)

- [ ] Le backend crée au plus 1 nouvelle carte quotidienne par joueur et par monde, avec reset logique à `04:00 Europe/Paris`.
- [ ] Le backlog actif est borné à 3 cartes maximum.
- [ ] Une carte générée contient 4 à 6 tâches issues des boucles naturelles déjà livrées, sans tâche artificielle.
- [ ] La progression des tâches MVP se fait via faits métier backend existants, notamment `unit.trained`, `building.completed`, `battle.resolved`, `scout.reported`, `reinforcement.sent` ou `garrison.added`.
- [ ] Un Oyez actif unique par monde peut être exposé par API ; le MVP supporte aussi l'absence d'Oyez actif.
- [ ] Une carte complétée devient réclamable, puis ne peut être réclamée qu'une seule fois.
- [ ] Le claim valide l'ownership du village cible quand la récompense s'applique à un village.
- [ ] Le dernier village récompensé est mémorisé et renvoyé comme défaut de claim suivant.
- [ ] Les récompenses backend livrées sont modestes, plafonnées, sans bonus PvP durable, sans pass premium et sans progression saison avancée.
- [ ] Un smoke backend couvre génération, progression via event, claim avec village cible et lecture API.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- Prisma : skill `bftc-prisma`
- Workers/Outbox : skill `bftc-workers-outbox`

## Notes de cadrage

- Le lab mobile sert uniquement à anticiper les garde-fous : rattrapage doux, récompenses scalées modestes, choix simple, pas de pay-to-win.
- Ne pas réintroduire les anciennes bénédictions comme système séparé.
- Ne pas brancher inbox, notifications push, pass premium ou cycle de monde complet dans ce run.
- Si l'action "lancer un upgrade" est retenue, traiter explicitement l'absence d'event métier dédié au lancement ; `building.completed` ne couvre que la fin.
- Éviter les doubles comptages si la progression consomme les events Outbox déjà publiés pour WebSocket.

## Décomposition initiale (rempli par le lead à l'étape 3)

- T1 — Shared + Prisma : ajouter contrats DTO/Zod retention, modèles `DailyCard`, `DailyCardTask`, `DailyCardProgressEvent`, `DailyOyez`, migration non destructive.
- T2 — Backend module : ajouter `RetentionModule`, `GET /retention`, `POST /retention/cards/:cardId/claim`, génération lazy de cartes, Oyez actif et claim ressources.
- T3 — Projection Outbox : brancher `EventOutboxService` vers `RetentionService.recordOutboxEvent`, avec ledger idempotent par event.
- T4 — Smoke : couvrir génération, progression par events, Oyez, claim village, event `resources.changed`, idempotence de claim.
- T5 — Docs architecture : mettre à jour modules backend, data model et realtime.

## Progress (rempli pendant le run)

- 2026-05-15 — Préflight : worktree dirty limité aux fiches de planification Phase 10 validées par l'utilisateur ; specs/rules/SPEC/skills Prisma/Outbox/tests chargés.
- 2026-05-15 — Cartographie : aucun runtime daily/Oyez existant ; events métier requis déjà présents dans Outbox ; module backend/shared nécessaire.
- 2026-05-15 — Implémentation : modèles Prisma + shared DTO, `RetentionModule`, API REST, projection Outbox idempotente, récompense ressources plafonnée.
- 2026-05-15 — Vérification : migration appliquée sur DB dev et template smoke, smoke ciblé vert, `static-check` vert, smoke complet vert.

## Décisions prises

- Dérogation préflight : le worktree n'était pas clean, mais les seules modifications préexistantes étaient les fiches `026`/`027` et `tasks/README.md` issues du `$bftc-plan` immédiatement précédent ; l'utilisateur a explicitement validé de continuer.
- La génération de carte est lazy : `GET /retention` crée la carte du jour si le backlog le permet, et la projection d'un event métier peut aussi créer la carte du jour pour ne pas perdre les facts avant ouverture UI.
- Pas de nouveau WS event retention dans ce run : le frontend du run 027 consommera l'API REST et pourra invalider TanStack après actions existantes.
- Les récompenses MVP sont uniquement ressources modestes (`120/120/120`) et plafonnées par `ResourceStock.maxPerType`; pas de couronnes, pass, boost PvP ou progression saison.
- Review lead 5 axes : aucun finding bloquant après durcissement de la génération lazy par event.

## Rapport final

Run 026 livre le socle backend/shared des cartes quotidiennes + Oyez Phase 10.

Changements livrés :

- Shared : nouveau namespace `@battleforthecrown/shared/retention` avec DTOs et schemas Zod.
- Prisma : migration non destructive `20260515120000_add_daily_cards_oyez` pour `DailyCard`, `DailyCardTask`, `DailyCardProgressEvent`, `DailyOyez` et enums associés.
- Backend : `RetentionModule` avec `GET /retention` et `POST /retention/cards/:cardId/claim`.
- Progression : `EventOutboxService` projette les events `unit.trained`, `building.completed`, `battle.resolved` barbare victorieux, `scout.reported`, `reinforcement.sent` et `garrison.added` vers la plus ancienne carte active.
- Claim : ownership village vérifié, claim unique, dernier village récompensé mémorisé, `resources.changed` écrit dans l'Outbox.
- Docs : modèle de données, modules backend et realtime alignés.

Tickets ouverts : aucun. Run frontend restant : [`027-feature-daily-cards-oyez-frontend-hud`](../027-feature-daily-cards-oyez-frontend-hud.md).

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Génération quotidienne/backlog — preuve : `daily-retention.smoke.spec.ts` crée une carte depuis les facts Outbox avant ouverture UI ; `GET /retention` expose une seule carte active.
  - [x] Progression par events métier — preuve : smoke dispatch `unit.trained`, `building.completed`, `battle.resolved`, `scout.reported`, `reinforcement.sent` via `EventOutboxService`.
  - [x] Oyez actif exposé — preuve : smoke crée un `DailyOyez` actif et vérifie `GET /retention`.
  - [x] Claim idempotent avec village cible — preuve : smoke claim la carte une fois, vérifie `rewardVillageId`, puis second claim `409`.
  - [x] Récompense modérée et plafonnée — preuve : service applique `120/120/120` via `Math.min(..., maxPerType)` et smoke vérifie l'incrément de ressources.
  - [x] Event realtime ressources après claim — preuve : smoke vérifie une row `resources.changed` dans `EventOutbox`.
- **Tests automatisés** :
  - `yarn workspace battleforthecrown-backend jest --config ./test/jest-smoke.json --runInBand daily-retention` ✅ 1 suite / 1 test.
  - `yarn static-check` ✅ backend type-check, pixi type-check, backend lint, pixi lint.
- **Smokes lancés** :
  - `yarn test:smoke:preflight` ✅ template smoke migré, 8 clones prêts.
  - `yarn test:smoke` ✅ 23 suites / 44 tests.
- **Smokes ajoutés/modifiés** :
  - Ajouté `battleforthecrown-backend/test/daily-retention.smoke.spec.ts` : génération carte, Oyez, progression Outbox, claim village, event resources, second claim refusé.
- **QA fonctionnelle agent** : couverte par smoke REST réel Nest + Prisma + Outbox sur DB smoke. Migration appliquée sur `battleforthecrown` et `battleforthecrown_smoke`.
- **Tests IG à faire par le user** : Aucun test IG nécessaire pour ce run backend/shared ; le rendu et l'interaction HUD seront couverts par le run 027.
