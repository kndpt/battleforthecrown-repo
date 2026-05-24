# Run #032 — world-lifecycle-foundation-and-identity

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap explicite — débloque l'écran « Sélection des Royaumes » (cf. Run #033) et finit le socle MVP du cycle de vie d'un monde.
- **Spec source** :
  - [`docs/gameplay/19-world-lifecycle.md`](../../docs/gameplay/19-world-lifecycle.md) — § Paramètres MVP, § Cycle de transition entre status.
  - [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md) — § 5.3 (paramètres world-scoped distincts du tempo).
- **Type** : feature backend + shared (aucun écran)
- **Modules backend** : `world` (controller, service, world-config service), nouveau `WorldLifecycleWorker` (pg-boss), `OutboxWorker` (publication transitions optionnelle)
- **Modules frontend** : aucun (l'écran de sélection est livré par Run #033)

## Contexte

Audit du 2026-05-24 (cf. conversation) : le tempo est 100 % branché, le schéma `WorldStatus` est en place, `JoinWorldUseCase` rejette `LOCKED`/`ENDED`. **Manquent** :

1. Les paramètres lifecycle dans `WorldConfig` (`worldDuration`, `inscriptionMainDays`, `inscriptionLateDays`, `newWorldEverydays`, `newbieShieldHours`).
2. Les workers de transition `PLANNED → OPEN → LOCKED → ENDED`.
3. Le sous-flag `inscriptionPhase` (`'main' | 'late'`) calculé à la volée.
4. L'identité publique d'un monde (`displayName`, `tagline`, `sigil`, `themeColor`, `tier`) pour l'écran de sélection (cf. Run #033).
5. Un endpoint public enrichi qui liste les mondes joignables avec toutes ces métadonnées.

Choix produit tranchés en clarification :
- Pas d'indicateur d'activité (CALME/NAISSANT/…) — retiré de l'UI.
- Classification `tier: DEBUTANTS | CLASSED` introduite côté config (tous les mondes MVP = `DEBUTANTS`, `CLASSED` réservé post-classements).
- Identité monde dans `WorldConfig` (pas une table dédiée).
- Notifs « me prévenir à l'ouverture » : **post-MVP** (Run #033 affiche un CTA placeholder).

## Dépendances

- Run #026 (tempo plumbing) ✅ DONE.
- Run #027 (tempo recalibration) ✅ DONE.
- Postcondition : débloque **Run #033** (écran sélection royaumes Pixi) qui consomme le DTO public exposé ici.

## Critère de fin (acceptance)

### Schéma & contrat shared

- [ ] `WorldConfigSchema` (`packages/shared/src/world/schemas.ts`) expose un sous-objet `lifecycle` :
  - `worldDuration` (jours, default **60**)
  - `inscriptionMainDays` (default **7**)
  - `inscriptionLateDays` (default **3**)
  - `newWorldEverydays` (default **7**, doc seulement, pas de worker MVP)
  - `newbieShieldHours` (default **48**, wall-clock — déjà utilisé ailleurs, à centraliser ici si appliquant)
- [ ] `WorldConfigSchema` expose un sous-objet `identity` :
  - `displayName: string` (ex. « Aubeforge »)
  - `tagline: string` (≤ 80 chars, ex. « Où les vassaux bâtissent leur… »)
  - `sigil: enum` (catalogue fini : `crown | tree | star | cross | flame | fleur | …` — liste minimale à 6-8 valeurs, extensible)
  - `themeColor: enum` (catalogue fini : `green | teal | crimson | purple | gold | azure | silver | onyx`)
  - `tier: enum` (`DEBUTANTS | CLASSED`, default `DEBUTANTS`)
- [ ] Helper pur `deriveInscriptionPhase(world, now)` dans shared retourne `'main' | 'late' | 'closed'` à partir de `world.startedAt` + `config.lifecycle`.
- [ ] Helper pur `deriveWorldDayCounter(world, now)` retourne `{ day: number, totalDays: number }` (ex. `{ day: 5, totalDays: 60 }`).

### Migration & seed

- [ ] Migration Prisma (JSON, pas de changement de schéma SQL — `WorldConfig` reste `Json`) qui rétro-fitte les mondes existants avec `lifecycle` + `identity` par défaut. Les noms existants conservent leur valeur ; identité par défaut si absente.
- [ ] Seed `prisma/seed-default-world-config.sql` (ou équivalent TS) mis à jour.

### Workers de transition

- [ ] Nouveau worker pg-boss `WorldLifecycleWorker` (poll horaire, voire toutes les 5 min) :
  - `PLANNED → OPEN` quand `world.plannedOpenAt <= now()` ; set `startedAt = now()` et `endsAt = startedAt + worldDuration`.
  - `OPEN → LOCKED` quand `startedAt + (inscriptionMainDays + inscriptionLateDays) <= now()`.
  - `LOCKED → ENDED` quand `endsAt <= now()`.
- [ ] Ajout d'un champ `World.plannedOpenAt: DateTime?` (migration Prisma SQL) — nécessaire pour les mondes `PLANNED` qui affichent « Ouvre dans 2j 14h » dans l'écran. Nullable pour rétro-compat avec les mondes déjà en `OPEN`.
- [ ] Chaque transition émet un `EventOutbox` (`world.status.changed`) avec `{ worldId, from, to, at }` — consommable par le front pour rafraîchir la liste.
- [ ] Snapshot leaderboard / wipe **hors scope** (post-MVP, ticket dédié si requis).

### Endpoint public

- [ ] `GET /worlds/public` (ou enrichissement de l'existant) retourne pour chaque monde **joignable ou planifié** :
  ```ts
  {
    id, status, // PLANNED | OPEN | LOCKED
    identity: { displayName, tagline, sigil, themeColor, tier },
    lifecycle: {
      day: number | null,             // null si PLANNED
      totalDays: number,
      inscriptionPhase: 'main' | 'late' | 'closed',
      startedAt: string | null,
      endsAt: string | null,
      plannedOpenAt: string | null,   // pour PLANNED uniquement
    },
    tempoProfile: 'standard',          // dérivé de tempo.global (1.0 = standard)
    joinedCount: number,               // count WorldMembership
  }
  ```
- [ ] Les mondes `ENDED` sont **exclus** par défaut (paramètre `?includeEnded=true` optionnel post-MVP).
- [ ] DTO + schéma Zod dans `packages/shared/src/world/` pour partage front.

### Tests

- [ ] Pure-logic : `deriveInscriptionPhase`, `deriveWorldDayCounter` (≥ 6 cas chacun).
- [ ] Unit backend : `WorldLifecycleWorker` (chaque transition + idempotence + non-bascule prématurée).
- [ ] Smoke : `worlds-public.smoke.spec.ts` qui valide le payload pour 1 `PLANNED`, 1 `OPEN main`, 1 `OPEN late`, 1 `LOCKED`.
- [ ] `JoinWorldUseCase` continue de rejeter `LOCKED`/`ENDED` — smoke existant vert.

### Validation

- [ ] `yarn static-check` vert.
- [ ] Smokes backend verts.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage.)_

## Progress (rempli pendant le run)

_(Vide au démarrage.)_

## Décisions prises

_(Vide au démarrage.)_

## Rapport final

_(Vide au démarrage.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [ ] _(à remplir)_
- **Review indépendante** : à déclencher (back+front via DTO partagé, modifie le contrat public d'un domaine MVP).
- **Tests automatisés** : à remplir.
- **Smokes ajoutés/modifiés** : à remplir.
- **QA fonctionnelle agent** : à remplir (à minima : `curl GET /worlds/public` sur 3 mondes en états distincts seedés).
- **Tests IG à faire par le user** : aucun (pas d'UI livrée par ce run).

## Points d'attention

- **Pas de cap joueurs MVP** : la spec 19 dit explicitement « Pas de cap au MVP ». Le wording « Royaume complet » dans le mockup d'écran est trompeur — Run #033 utilisera « Inscription close » pour tous les `LOCKED`.
- **Sigil & themeColor en enum** : pas de chemin d'asset codé en dur dans la DB. Le mapping enum → asset/couleur vit côté frontend.
- **`plannedOpenAt` nullable** : seul champ SQL ajouté. Rétro-compat assurée pour les mondes déjà en `OPEN`.
- **Notif « me prévenir »** : aucun travail backend ici. Ticket à ouvrir post-MVP.
