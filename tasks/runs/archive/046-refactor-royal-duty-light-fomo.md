# Run #046 — refactor-royal-duty-light-fomo

> **Statut** : DONE
> **Démarré** : 2026-06-02
> **Terminé** : 2026-06-02

## Cible

- **Phase roadmap** : Phase 10 — Rétention quotidienne MVP
- **Spec source** : [`docs/gameplay/05-daily-cards-and-oyez.md`](../../../docs/gameplay/05-daily-cards-and-oyez.md), [`docs/gameplay/lab/mobile-retention-modernization.md`](../../../docs/gameplay/lab/mobile-retention-modernization.md) en inspiration non canonique
- **Type** : refacto
- **Modules backend** : `retention`, `prisma`, `event`
- **Modules frontend** : `pixi/features/retention`, `pixi/api`

## Dépendances

- Les runs [`026 — Cartes quotidiennes & Oyez backend/shared`](./026-feature-daily-cards-oyez-backend-shared.md) et [`027 — Cartes quotidiennes & Oyez frontend/HUD`](./027-feature-daily-cards-oyez-frontend-hud.md) ont livré le modèle actuel avec backlog ; ce run le remplace comme cible gameplay.
- La règle Phase 9 de choix du village récompensé reste inchangée : le claim demande un village possédé et propose le dernier village récompensé par défaut.
- Les bénédictions quotidiennes et grosses récompenses couronnes restent hors scope MVP, cf. [`tasks/archive/17-blessings-temporal-effects.md`](../../archive/17-blessings-temporal-effects.md) et [`tasks/archive/28-royal-blessing-crown-percentage.md`](../../archive/28-royal-blessing-crown-percentage.md).
- L'onboarding scripté reste distinct des daily cards ; ne pas transformer le Devoir royal en tutoriel.
- Migrations Prisma non destructives uniquement. Ne jamais reset la DB.

## Critère de fin (acceptance)

- [ ] `docs/gameplay/05-daily-cards-and-oyez.md` ne décrit plus de backlog/rattrapage de cartes non terminées et acte la cible `1 carte / jour` (automatisable : grep/doc).
- [ ] Le backend génère au maximum une carte quotidienne `ACTIVE` visible pour le `currentDayKey` d'un `userId × worldId` (automatisable : test/smoke).
- [ ] Une carte `ACTIVE` ancienne non complétée ne bloque pas la création de la carte du nouveau jour après reset 04h00 Europe/Paris (automatisable : test/smoke).
- [ ] Une carte complétée mais non réclamée reste réclamable uniquement selon la règle de grâce explicitée en spec, puis le claim reste unique (automatisable : test/smoke).
- [ ] Les cartes générées contiennent exactement 3 tâches naturelles issues de faits métier backend, sans validation par clic UI (automatisable : test/smoke).
- [ ] Le smoke daily-retention vérifie progression par events, claim village, `resources.changed` et absence de backlog actif multiple (automatisable : test).
- [ ] Le frontend n'affiche plus `Cartes en attente` ni `rattraper les jours manqués` (automatisable : test/grep).
- [ ] La sheet Devoir royal affiche un wording clair `Expire à 04h00` et reste lisible en session mobile courte (visuel/gameplay).
- [ ] L'Oyez reste une variation douce/contextuelle et ne réintroduit ni bénédiction, ni pass, ni bonus PvP durable (visuel/gameplay + doc).

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Prisma : skill `bftc-prisma`
- Workers/Outbox : skill `bftc-workers-outbox`
- Frontend HUD : skill `bftc-react-hud`

## Décomposition initiale (rempli par le lead à l'étape 3)

- T1 — Spec gameplay : mettre à jour `docs/gameplay/05-daily-cards-and-oyez.md` pour acter `1 carte du jour`, 3 tâches naturelles, reset/expiration 04h00, suppression du rattrapage, et règle de grâce si retenue.
- T2 — Backend lifecycle : ajuster `RetentionService` pour ne plus créer/exposer un backlog de 3 cartes `ACTIVE`, réduire les tâches MVP à 3 et gérer les cartes anciennes selon la règle spec.
- T3 — Shared/API contract : supprimer ou neutraliser les champs de backlog devenus trompeurs, ou ajouter les champs d'expiration/grâce nécessaires dans `types.ts` et `schemas.ts`.
- T4 — Frontend HUD : retirer `Cartes en attente` et le hint de rattrapage, afficher `Expire à 04h00`, garder le claim village et l'Oyez comme variation douce.
- T5 — Tests/QA : mettre à jour unit/service, smoke daily-retention et Vitest widget pour prouver 3 tâches, absence de backlog/rattrapage, claim unique, reset 04h00 et ressources après claim.

## Progress (rempli pendant le run)

- 2026-06-02 — Préflight terminé dans un worktree propre `/tmp/bftc-046`, branche `run/046-refactor-royal-duty-light-fomo` basée sur `origin/main`. Travail local utile importé : fiche run 046 et sceau royal topbar.
- 2026-06-02 — Cartographie terminée : `RetentionService` générait jusqu'à 3 cartes ouvertes et 5 tâches, le HUD affichait un backlog/rattrapage, et la doc canonique décrivait encore l'ancien modèle.
- 2026-06-02 — Implémentation backend/shared terminée : statut `EXPIRED`, génération d'une carte courante, 3 tâches MVP, expiration des anciennes `ACTIVE`, grâce de claim bornée à la clé courante/précédente.
- 2026-06-02 — Implémentation frontend/docs terminée : résumé retention validé par Zod, backlog runtime supprimé, wording `Expire à 04h00`, sceau royal topbar partagé, doc gameplay alignée.
- 2026-06-02 — Review lead : correction du helper de reset quotidien qui utilisait implicitement un décalage UTC fixe ; ajout d'un test DST et d'un garde-fou `SPEC.md` B3.
- 2026-06-02 — Vérifications terminées : unit retention, Vitest daily/header/layout, smokes retention + onboarding, grep wording, `static-check`.

## Décisions prises

- **Piste cible** : pas de pile de cartes visible. Une seule carte du jour est générée comme `ACTIVE`; les anciennes `ACTIVE` deviennent `EXPIRED`.
- **Grâce de claim** : une carte `CLAIMABLE` reste visible/réclamable pour la clé quotidienne courante ou précédente uniquement. Au-delà, elle expire.
- **Tâches MVP** : 3 faits naturels backend (`unit.trained`, `building.completed`, `battle.resolved` victoire barbare). Les projections scout/renfort peuvent rester sans effet tant qu'aucune tâche de ce type n'est générée.
- **Migration Prisma** : ajout non destructif de la valeur enum `DailyCardStatus.EXPIRED`; aucun reset DB.
- **Reset 04h00** : calcul par heure locale Europe/Paris réelle, pas par soustraction fixe de 4h UTC, pour survivre aux transitions DST.
- **Review indépendante** : non déclenchée localement, contrainte outil Codex : les sub-agents ne sont disponibles que sur demande explicite de l'utilisateur. Review lead 5 axes effectuée et PR ouverte pour review externe.

## Rapport final

Run livré :

- Backend : lifecycle daily simplifié à 1 carte du jour, anciennes cartes expirées, claim unique avec fenêtre de grâce, 3 tâches MVP.
- Shared/API : `DailyCardStatus` inclut `EXPIRED`; le frontend parse `RetentionSummary` avec le schema partagé.
- Frontend : le Devoir royal n'affiche plus de backlog/rattrapage, annonce `Expire à 04h00`, et le sceau royal est intégré au header/topbar.
- Docs : `docs/gameplay/05-daily-cards-and-oyez.md` acte la cible MVP; `SPEC.md` ajoute le garde-fou DST B3.
- Tests : smoke daily-retention renforcé; smoke onboarding aligné avec la carte à 3 tâches; Vitest widget/header/layout.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Doc canonique sans ancien backlog/rattrapage et cible `1 carte / jour` — `rtk grep -n "backlog\\|Backlog" docs/gameplay/05-daily-cards-and-oyez.md` → 0 occurrence.
  - [x] Une seule carte `ACTIVE` visible pour le `currentDayKey` — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- daily-retention.smoke.spec.ts` → scénario reset vert, 1 `ACTIVE` DB.
  - [x] Ancienne carte `ACTIVE` non complétée n'empêche pas la carte du nouveau jour — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- daily-retention.smoke.spec.ts` → ancienne carte passée `EXPIRED`, nouvelle carte courante créée.
  - [x] Carte complétée non réclamée avec grâce bornée et claim unique — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- daily-retention.smoke.spec.ts` → précédente `CLAIMABLE` réclamable, plus ancienne `EXPIRED`, claim expiré 400.
  - [x] 3 tâches naturelles issues de faits backend — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- daily-retention.smoke.spec.ts` → 3 tâches, progression par events Outbox, statut `CLAIMABLE`.
  - [x] Smoke daily-retention couvre progression, claim village, `resources.changed`, absence de pile active — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- daily-retention.smoke.spec.ts` → 3 tests passés.
  - [x] Frontend sans `Cartes en attente` ni `rattraper les jours manqués` — `rtk grep -n "Cartes en attente\\|rattraper les jours manqués\\|Prochain reset\\|Reset à" docs/gameplay/05-daily-cards-and-oyez.md battleforthecrown-pixi/src battleforthecrown-backend/src battleforthecrown-backend/test packages/shared/src` → 0 occurrence.
  - [x] Sheet affiche `Expire à 04h00` — `rtk yarn workspace battleforthecrown-pixi test DailyRetentionWidget.test.tsx` → assertion de rendu verte.
  - [x] Oyez reste contextuel, sans bénédiction/pass/bonus PvP durable — `rtk grep -n "Bénédiction\\|pass\\|bonus PvP" battleforthecrown-pixi/src/features/retention` → 0 occurrence runtime.
- **Review indépendante** : Non déclenchée localement, raison : contrainte outil Codex sub-agent sans demande explicite user. Review lead 5 axes effectuée ; finding correctness DST corrigé et couvert par test + `SPEC.md` B3.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-backend test -- retention.service.spec.ts` → 1 suite / 5 tests passés.
  - `rtk yarn workspace battleforthecrown-pixi test DailyRetentionWidget.test.tsx` → 1 suite / 6 tests passés.
  - `VITE_API_BASE_URL=http://localhost:15002 VITE_WS_URL=http://localhost:15002 rtk yarn workspace battleforthecrown-pixi test GameHeader.test.tsx GameShellLayout.test.tsx DailyRetentionWidget.test.tsx` → 3 suites / 22 tests passés.
  - `rtk yarn static-check` → passé.
- **Smokes lancés** :
  - `rtk yarn workspace battleforthecrown-backend test:smoke:preflight` → OK après application non destructive de la migration sur `battleforthecrown_smoke`.
  - `rtk yarn workspace battleforthecrown-backend test:smoke:run -- daily-retention.smoke.spec.ts` → 1 suite / 3 tests passés.
  - `rtk yarn workspace battleforthecrown-backend test:smoke:run -- onboarding.smoke.spec.ts` → 1 suite / 3 tests passés.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/daily-retention.smoke.spec.ts` couvre 3 tâches, expiration ancienne `ACTIVE`, grâce de claim, `resources.changed`; `onboarding.smoke.spec.ts` aligné sur carte quotidienne à 3 tâches.
- **QA fonctionnelle agent** : couverte par smoke backend réel (`REST /retention`, dispatch Outbox, DB smoke, claim ressources). Pas de QA browser IG côté agent conformément aux règles.
- **Tests IG à faire par le user** :
  - [ ] Ouvrir Devoir royal depuis `/game` et vérifier le sceau topbar + `Expire à 04h00`.
  - [ ] Vérifier qu'il n'y a pas de bloc `Cartes en attente` ni texte de rattrapage.
  - [ ] Vérifier que la sheet reste lisible sur mobile avec 3 tâches et Oyez éventuel.
