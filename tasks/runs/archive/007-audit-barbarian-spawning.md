# Run #007 — audit-barbarian-spawning

> **Statut** : DONE
> **Démarré** : 2026-05-10
> **Terminé** : 2026-05-10

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (cf. [`../00-mvp-roadmap.md`](../00-mvp-roadmap.md)). 7ᵉ et **dernier sous-run** de la phase. **Cas particulier roadmap** : spec en chantier — arbitrage A/B en première étape du run.
- **Spec source** : [`docs/gameplay/07-barbarian-spawning.md`](../../docs/gameplay/07-barbarian-spawning.md) **EN CHANTIER**
- **Référence connexe** : [`tasks/archive/26-barbarian-recycling-vs-spawn.md`](../archive/26-barbarian-recycling-vs-spawn.md) (décision provisoire 2026-05-09 — à reprendre en pré-launch)
- **Specs voisines (référence, pas dans le scope)** : [`docs/gameplay/06-barbarians.md`](../../docs/gameplay/06-barbarians.md) § Distribution sur la carte / § Régénération naturelle ; [`docs/gameplay/01-overview.md`](../../docs/gameplay/01-overview.md) § Monde persistant
- **Type** : `audit`
- **Modules backend** :
  - `battleforthecrown-backend/src/modules/world/barbarian-seeding.service.ts`
  - `battleforthecrown-backend/src/modules/world/barbarian-backfill.worker.ts`
  - `battleforthecrown-backend/src/modules/world/barbarian-village.factory.ts`
  - `battleforthecrown-backend/src/modules/world/village-placement.service.ts`
  - `battleforthecrown-backend/src/modules/world/join-world.use-case.ts`
  - `battleforthecrown-backend/src/modules/world/world-config.service.ts` (champ `barbarianSeeding`)
- **Modules frontend** : —
- **Modules transverses** :
  - `packages/shared/src/world/barbarian-geometry.ts` (`getChunksInRings`, `samplePositions`, `determineTier`)

## Dépendances

- **Run 005** [`audit-barbarians`](./005-audit-barbarians.md) — couvre les BV existants (templates, défense, régénération naturelle). Run 007 traite uniquement seeding + (selon arbitrage) respawn ; éviter le chevauchement.
- **Spec 07 dans son état actuel** : la première tâche du run dépend de la lecture conjointe de 07 + ticket 26 + roadmap (cas particulier explicite).
- Aucune dépendance runtime (DB / migration). Le code seeding est en place et fonctionnel.

## Critère de fin (acceptance)

- [ ] **Décision A vs B documentée** explicitement dans la fiche du run (§ Décisions prises), avec justification et date.
- [ ] Spec 07 et ticket 26 (archivé) mis à jour en cohérence avec la décision retenue (références croisées, pas de duplication — cf. `.claude/rules/docs.md`).
- [ ] Roadmap (`tasks/00-mvp-roadmap.md`, mention Phase 1 « cas particulier 07 ») mise à jour pour acter le résultat (finalisé / reporté).
- [ ] **Si Branche A (finaliser spec)** : chaque question ouverte de spec 07 § « Questions à trancher » est tranchée OU explicitement marquée « hors scope MVP » avec ticket de suite.
- [ ] **Si Branche A** : le code seeding actuel est confronté à la spec finalisée — chaque écart est soit corrigé, soit ticketé.
- [ ] **Si Branche A** : spec 07 perd son bandeau « EN CHANTIER » dans `docs/gameplay/README.md`.
- [ ] **Si Branche B (acter le report)** : décision « report post-MVP » écrite dans la spec 07 (encadré « Statut MVP ») avec critère de réouverture, ticket 26 noté « confirmé reporté MVP », et le code actuel est validé conforme à la décision provisoire (spawn à l'arrivée uniquement, pas de cron de régulation).
- [ ] Phase 1 close après ce run (aucun autre sous-run pending).
- [ ] `yarn workspace battleforthecrown-backend test` vert (si Branche A et code touché).
- [ ] Section `## Rapport final` remplie + commit final + QA.

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décomposition (Branche A — finale)

| # | Tâche | Fichiers | Critère de succès |
|---|---|---|---|
| T5.1 | Étendre `tierRanges` à T1-T5, `rMax` 40→60, ajouter T4/T5 dans `tiers` map (defaults + seed SQL + smoke fixture + migration jsonb_set pour mondes existants) | `packages/shared/src/world/world.ts`, `battleforthecrown-backend/prisma/seed-default-world-config.sql`, `battleforthecrown-backend/test/fixtures/smoke-world-config.ts`, nouvelle `prisma/migrations/<ts>_extend_barbarian_tier_ranges/migration.sql` | `DEFAULT_BARBARIAN_SEEDING_PLAN.tierRanges.length === 5`, `rMax === 60`, migration applicable. |
| T5.2 | Renommer `BarbarianBackfillWorker` → `BarbarianSeedingCatchupWorker`, mettre à jour commentaires + workers rule + realtime doc | `barbarian-backfill.worker.ts` → `barbarian-seeding-catchup.worker.ts`, `world.module.ts`, `.agents/rules/workers.md`, `docs/architecture/realtime.md` | `grep BackfillWorker` retourne 0. Backend boot OK. |
| T5.3 | Anti-submersion par présence joueur dans `seedChunk` : compter joueurs distincts (autre que déclencheur) dans chunk+halo, ajuster `capacity` (1 → /2 ; ≥2 → 0). Extraire la formule en helper pur testable. | `battleforthecrown-backend/src/modules/world/barbarian-seeding.service.ts`, `packages/shared/src/world/barbarian-geometry.ts` (helper pur `adjustCapacityForPlayerPresence`) | Helper testable, comportement runtime documenté. |
| T5.4 | Tests pure-logic : `getChunksInRings`, `samplePositions`, `determineTier` (T1-T5), `adjustCapacityForPlayerPresence` | `battleforthecrown-backend/src/modules/world/barbarian-geometry.spec.ts` (nouveau, consomme shared) | Tests verts. |
| T5.5 | Mettre à jour `tasks/00-mvp-roadmap.md` (Phase 1 close — cas particulier 07 résolu) + `tasks/archive/26-...md` (statut suite : finalisé MVP, ouvertures post-MVP) + `docs/gameplay/README.md` (lever bandeau « doc en chantier ») | 3 fichiers de doc | Bandeau levé, statut roadmap clos, ticket 26 reflète résolution. |

Pré-décomposition indicative (conditionnelle A/B) :

- **T1 — Arbitrage A/B (BLOQUANT, premier acte du run)** : relire spec 07 + ticket 26 + roadmap, lister les questions ouvertes, demander au user de trancher entre Branche A (finaliser la spec maintenant) et Branche B (acter le report explicite). **Aucun code touché tant que ce choix n'est pas pris.**

### Branche A — finaliser la spec

- T2A — Trancher chaque question ouverte de § Densité cible, § Rayon et placement, § Anti-submersion, § Distribution des tiers, § Cycle de vie post-génération, § Variables d'entrée. Mettre à jour 07 (références vers 06 plutôt que duplication).
- T3A — Confronter spec finalisée ↔ code (`barbarian-seeding.service`, `barbarian-backfill.worker`, `samplePositions`/`determineTier` dans shared). Tableau écart par écart.
- T4A — Statuer sur `barbarian-backfill.worker` (cron quotidien actuel) : conforme à la spec finalisée, à reconfigurer, ou à supprimer. Cohérence avec ticket 26.
- T5A — Corriger les écarts triviaux, ticketer le reste, lever le bandeau « EN CHANTIER ».

### Branche B — acter le report

- T2B — Rédiger l'encadré « Statut MVP — décision reportée » dans 07 (renvoi ticket 26), reformuler les questions ouvertes en « à reprendre en pré-launch ». Pas de duplication de contenu existant.
- T3B — Vérifier que le code en place implémente bien la décision provisoire (spawn à 1ère arrivée uniquement). Cas notable : `barbarian-backfill.worker` tourne en cron quotidien — incompatible textuellement avec « pas de cron de régulation » de la décision provisoire. Trancher : reclasser comme « catchup d'arrivée différée », désactiver, ou ouvrir un ticket dédié.
- T4B — Mettre à jour ticket 26 (statut, lien run 007) et roadmap (Phase 1 close avec 07 reporté).

### Final (les deux branches)

- T_final — Mettre à jour `docs/gameplay/README.md` (statut de 07) et fermer la fiche run.

## Points d'attention

- **Conflit apparent décision provisoire ↔ code** : ticket 26 et spec 07 § « Stratégie de spawn — décision provisoire » disent « pas de cron périodique de régulation », mais `barbarian-backfill.worker` tourne en `@Cron(EVERY_DAY_AT_MIDNIGHT)` et reseed les villages créés dans la dernière heure. À clarifier en T1 — sa sémantique réelle (catchup de chunks asynchrones non traités à l'arrivée, vu `MAX_SYNC_CHUNKS=4`) n'est pas la même qu'un cron de régulation densité, mais le naming et le commentaire prêtent à confusion.
- **Articulation avec spec 06 § Régénération naturelle** : spec 07 § Cycle de vie post-génération renvoie à 06 ; vérifier que la frontière reste nette (07 = création de villages, 06 = remplissage de villages existants). Si Branche A, ne pas dupliquer de règles entre les deux.
- **Frontière avec run 005** : run 005 audite les BV existants. Si run 005 a déjà tranché des points qui touchent 07 (templates, IA, régénération), s'aligner et ne pas refaire.
- **Ticket 26 archivé mais statut « décision provisoire »** : à confirmer en T1 que le user veut bien rouvrir l'arbitrage maintenant ou s'il préfère figer Branche B sans débat.
- **Anti-exploit migration de village** : noté dans ticket 26 comme question pré-launch. Si Branche A, décider si on ferme ce point ou si on le laisse pour pré-launch.
- **Distribution tiers selon niveau joueur** (spec 07 § Distribution des tiers à la génération) : couplage potentiel avec features futures (rejoin après wipe, monde persistant) — risque de scope creep si on ouvre la question.
- **`packages/shared`** : `samplePositions` / `determineTier` / `getChunksInRings` sont la traduction algorithmique de la spec. Tout changement spec en Branche A se répercute là — bien évaluer le coût avant de trancher une question.

## Notes — segmentation Phase 1

7ᵉ et dernier sous-run. L'arbitrage A/B en T1 est la pierre angulaire de ce run, pas un détail. Tant qu'il n'est pas tranché, aucune autre tâche n'a de sens.

**Recommandation pragmatique** : si le user n'a pas de signal playtest concret à apporter pour répondre aux questions ouvertes (densité cible, recyclage vs spawn neuf, etc.), Branche B est la voie économique et conforme à l'esprit du ticket 26 — Phase 1 ferme sans dette nouvelle, débat reporté en pré-launch comme prévu.

Le worker `BarbarianBackfillWorker` mérite une attention particulière dans les deux branches : son existence active contredit textuellement « pas de cron de régulation ». À clarifier (renaming, doc, ou désactivation) que la branche soit A ou B.

**Estimation scope** : Branche A = medium ; Branche B = small. À ré-estimer après l'arbitrage.

## Progress (rempli pendant le run)

- 2026-05-10 — Préflight OK, fiche `RUNNING`. T1 arbitrage A/B posée au user.
- 2026-05-10 — User tranche : **Branche A** (finaliser la spec maintenant). Worker backfill : **« la documentation est maître »** — la spec finalisée commandera le sort du worker (renaming/doc ou désactivation selon le texte arbitré).

## Décisions prises

### T1 — Arbitrage A/B (2026-05-10)

- **Branche A retenue** : on finalise la spec 07 maintenant, on confronte au code, on corrige les écarts, on lève le bandeau « EN CHANTIER ».
- **Justification user** : décision design assumée, on ne reporte pas en pré-launch.
- **Worker backfill** : la documentation est maîtresse — si la spec finalisée admet un catchup d'arrivée différée, renaming + doc ; sinon désactivation.

### Choix structurants (2026-05-10, validés user)

- **T4/T5 seeding** → Étendre à T1-T5 dans cette run. tierRanges + tiers map à compléter, propagation au seed SQL.
- **Anti-submersion (joueurs voisins)** → Implémenter maintenant. Algorithme MVP simple : compter les *autres* villages joueurs présents dans le chunk + halo ; ≥ 1 autre joueur → `capacity` divisée par 2 ; ≥ 2 autres joueurs → chunk skipped (capacity = 0). Garde le mécanisme existant `need = capacity − existingCount` (anti-saturation BV locale).
- **Tiers × level** → Pure distance, fixe (MVP). Le low-level voit T4/T5 au loin (cible long terme). Pas de coupling avec features futures.
- **Worker backfill** → Reclasser comme « catchup d'arrivée différée » : renaming (`BarbarianBackfillWorker` → `BarbarianSeedingCatchupWorker`), doc commentaire/spec explicite. Pas de désactivation.

## Rapport final

### Synthèse

- **Branche A** retenue (validée user). Spec 07 finalisée : déclencheur, anneau `[8, 60]`, distribution T1-T5 par distance, anti-submersion par présence joueur, catchup d'arrivée différée. Bandeau « doc en chantier » levé.
- **Phase 1 close** — 7ᵉ et dernier sous-run.

### Écarts traités

| # | Écart | Action | Statut |
|---|---|---|---|
| 1 | tierRanges T1-T3 / spec T1-T5, `rMax`=40 | Étendu T1-T5, `rMax`=60. Defaults shared + seed SQL + fixture smoke + migration `jsonb_set` pour mondes existants. | Fixé |
| 2 | `BarbarianBackfillWorker` naming + commentaires suggérant "régulation densité" | Renommé `BarbarianSeedingCatchupWorker` partout (code + workers.md + realtime.md + backend-modules.md + data-model.md + smoke-tests.md + 19-world-lifecycle.md + ticket 41). Sémantique « catchup d'arrivée différée » explicitée. | Fixé |
| 3 | data-model.md disait *« reseedés après destruction/conquête »* — factuellement faux | Phrase remplacée pour décrire la sémantique catchup réelle. | Fixé (correction historique) |
| 4 | Anti-submersion par présence joueur absente | Helper pur `adjustCapacityForPlayerPresence` dans shared + intégration dans `seedChunk` (compte joueurs distincts dans chunk+halo, `1 → /2`, `≥2 → 0`). | Fixé |
| 5 | Aucun test pure-logic sur géométrie | 19 tests Jest sur `getChunksInRings`, `samplePositions`, `determineTier` (T1-T5), `adjustCapacityForPlayerPresence`. | Fixé |

### Fichiers touchés

**Code/seed/migration** :
- `packages/shared/src/world/world.ts` (defaults T1-T5, `rMax`=60)
- `packages/shared/src/world/barbarian-geometry.ts` (helper `adjustCapacityForPlayerPresence`)
- `battleforthecrown-backend/src/modules/world/barbarian-seeding.service.ts` (anti-submersion)
- `battleforthecrown-backend/src/modules/world/barbarian-seeding-catchup.worker.ts` (rename via `git mv`)
- `battleforthecrown-backend/src/modules/world/world.module.ts` (rebind)
- `battleforthecrown-backend/prisma/seed-default-world-config.sql` (T4/T5)
- `battleforthecrown-backend/prisma/migrations/20260510120000_extend_barbarian_tier_ranges/migration.sql` (nouveau)
- `battleforthecrown-backend/test/fixtures/smoke-world-config.ts` (T4/T5 fixture)
- `battleforthecrown-backend/test/smoke.spec.ts` (références renaming)
- `battleforthecrown-backend/src/modules/world/barbarian-geometry.spec.ts` (nouveau, 19 tests)

**Docs** :
- `docs/gameplay/07-barbarian-spawning.md` (réécrite, bandeau levé)
- `docs/gameplay/README.md` (description 07)
- `docs/architecture/data-model.md` (correction sémantique)
- `docs/architecture/backend-modules.md` (renaming)
- `docs/architecture/realtime.md` (renaming + sémantique)
- `docs/architecture/smoke-tests.md` (renaming)
- `docs/gameplay/19-world-lifecycle.md` (renaming + reformulation)
- `battleforthecrown-backend/.agents/rules/workers.md` (table workers + exception Outbox)

**Tasks** :
- `tasks/00-mvp-roadmap.md` (cas particulier 07 résolu)
- `tasks/archive/26-barbarian-recycling-vs-spawn.md` (statut → finalisé MVP)
- `tasks/41-capture-window-data-model.md` (renaming + note clarification)

### Tickets ouverts (suite post-MVP)

Aucun nouveau ticket. Les pistes post-MVP (cap densité globale monde, recyclage des BV morts, cron de régulation centralisé) sont déjà documentées dans la spec 07 § Anti-submersion / Hors scope MVP et dans le ticket archivé `26-barbarian-recycling-vs-spawn.md` (statut suite : signal playtest requis).

### Tests

- 251 / 251 verts (158 backend unit + 79 pixi unit + 14 backend smoke).
- Migration `20260510120000_extend_barbarian_tier_ranges` appliquée sans erreur sur la DB smoke.
- Builds verts : `@battleforthecrown/shared`, `battleforthecrown-backend` (Nest).

### QA backend (vérifié par l'agent)

**Résultat attendu** : la suite de tests automatisée + builds couvrent l'essentiel (helper pur + flow seed/migration validés via smoke). Pas de QA IG nécessaire — pas d'effet UI nouveau (le seeding tourne en background, le frontend n'a pas de surface différente).

- [x] `yarn test` (backend + pixi unit) : 237 / 237.
- [x] `yarn test:smoke` (backend smoke + migration) : 14 / 14.
- [x] `yarn workspace @battleforthecrown/shared build` : OK.
- [x] `yarn workspace battleforthecrown-backend build` (Nest) : OK.

### Méta-évaluation

- Décomposition 5 tâches chirurgicales correctement délimitées (T5.1-T5.4) — aucun retry implementer nécessaire.
- 1 dérogation lead minime (suppression d'un bump `seedVersion` inconsistant) sans impact runtime.
- Pas de blocage. 1 aller-retour clarification user (3 questions structurantes) en début de run.

### Décision finale (Branche A vs B)

Branche A retenue. La spec MVP est désormais cohérente avec le code (T1-T5 alignés, anti-submersion implémentée, sémantique du worker catchup explicitée). Phase 1 close.
