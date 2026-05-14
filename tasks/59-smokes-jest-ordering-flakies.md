# 59 — Smokes backend : flakies par ordering Jest

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Spec amont** : [`docs/architecture/local-ci.md` § Pourquoi sortir les smokes du hook](../docs/architecture/local-ci.md#pourquoi-sortir-les-smokes-du-hook)

## Symptôme

Les smokes backend (`yarn test:smoke`) sont non déterministes : le même code peut passer ou casser selon l'ordre d'exécution des fichiers, sans aucun changement de logique. Conséquence observée : `yarn test` vert localement, `pre-push` rouge, rerun à l'identique → vert.

Documenté dans `local-ci.md` comme un fait acquis qui justifie la sortie des smokes du hook pre-push. Mais c'est un bug, pas une fatalité.

## Cause racine probable

Jest exécute les fichiers de test dans un ordre dépendant du cache `.jest-cache` via l'heuristique `slowestFirst` (sequencer par défaut). Si deux smokes partagent un état non isolé — connexion DB, table partagée, données seed, état pg-boss, registre Outbox — l'ordre conditionne le résultat.

Hypothèses à confronter :

- Données seed non isolées entre fichiers (utilisateurs, mondes, villages).
- Connexion Prisma partagée (`PrismaService` lifecycle) qui voit des résidus du smoke précédent.
- `EventOutbox` non purgé entre smokes.
- pg-boss queue non drainée entre smokes.
- Worker timers (`setInterval`) qui survivent à un `afterAll` partiel.

## Comportement attendu

- `yarn test:smoke` produit le même résultat quel que soit l'ordre d'exécution des fichiers.
- Pas de fuite d'état entre fichiers smoke (DB, queues, workers, timers).
- Soit le sequencer est forcé déterministe, soit l'isolation par fichier est suffisamment forte pour que l'ordre soit indifférent.

## Pistes

### A — Forcer un sequencer déterministe

- Ajouter une option Jest `testSequencer` qui trie les fichiers par chemin alphabétique ou par hash stable.
- Avantage : 5 lignes de code, déterminisme garanti.
- Limite : masque potentiellement des fuites d'état réelles plutôt que les corriger. À envisager seulement si l'isolation par fichier est déjà bonne et que le flake vient juste de `slowestFirst`.

### B — Forcer `--runInBand` sur smokes uniquement

- Lancer `yarn test:smoke` avec `--runInBand` (séquentiel single-process, pas de worker Jest).
- Avantage : trivial, élimine la course entre workers concurrents.
- Limite : ne règle pas l'ordering entre fichiers ; à combiner avec piste A.

### C — Diagnostiquer puis fixer la fuite d'état réelle

- Identifier précisément les smokes qui se polluent mutuellement via reproduction ciblée (`jest --testPathPattern` dans deux ordres opposés).
- Renforcer `beforeEach`/`afterAll` : truncate des tables touchées, purge `EventOutbox`, drain pg-boss queues, clear timers.
- Avantage : solution propre, garde le parallélisme Jest si possible.
- Limite : effort plus important, demande inspection cas par cas.

## Scope recommandé

1. Reproduire le flake en local : lancer la suite smoke avec deux ordres opposés via `--testSequencer` custom ou un script qui force l'ordre.
2. Choisir la piste retenue (probable combinaison A + C : sequencer stable comme garde-fou + corrections d'isolation ciblées).
3. Mettre à jour `docs/architecture/local-ci.md` :
   - Retirer ou nuancer la section « flakies par ordering » comme cause de la sortie smokes du hook.
   - Documenter la nouvelle garantie d'ordre.
4. Décider si les smokes peuvent revenir dans `pre-push` une fois fiables, ou si le coût (~60 s) reste une raison suffisante de les laisser dans `/run`. Acter explicitement.

## Découvertes — tentative 1 (2026-05-14, revertée par `bcf63b1`)

**Hypothèse testée** : piste A seule (sequencer alphabétique stable via `@jest/test-sequencer`). Hypothèse de base : `--runInBand` + `maxWorkers: 1` étant déjà actifs, l'ordre des fichiers serait la seule source restante de non-déterminisme.

**Verdict** : **insuffisant**, voire pire. La fixation d'ordre expose systématiquement un état partagé que `slowestFirst` (heuristique cache) atténuait probabilistiquement.

**Reproduction observée** :
- Ordre alphabétique : `army-training-read.smoke.spec.ts` → `combat-conquest-hook.smoke.spec.ts` → …
- `combat-conquest-hook` fait `waitFor timed out after 30000ms` sur le `PendingConquest` status `OPEN` (helpers.ts:143 via launchConquest:125).
- 2 runs verts sur 5 (random luck dans `slowestFirst` non reproductible).

**Conclusion** : la piste C (vraie isolation d'état entre fichiers) est obligatoire. Piste A seule a été annulée. Pistes B (`--runInBand`) déjà appliquée.

**Pistes d'investigation pour piste C** :
- `bootSmokeApp.close` fait `boss.stop({ timeout: 1_000 })` puis `DELETE FROM pgboss.job` — le timeout 1s peut couper du graceful shutdown, laissant des handlers pg-boss/Nest qui survivent.
- `truncateAll` (helpers.ts) **ne purge pas** `pgboss.job`, `pgboss.archive`, `pgboss.schedule`, `pgboss.queue` au boot du fichier suivant — seul le close précédent l'a fait.
- L'`OutboxWorker` et les workers (`production`, `construction`, `training`, `crown-production`, `return`) installent probablement des `setInterval` qui peuvent survivre à l'`app.close()` si non explicitement clearés.
- pg-boss installe un superviseur (cf erreur `Boss.#monitor` vue dans les logs : `Cannot destructure property 'rows' of '(intermediate value)' as it is undefined` après les tests) — preuve que la connexion pg-boss survit ou est consultée après teardown.

**Hypothèse forte** : entre `army-training-read.afterAll` et `combat-conquest-hook.beforeAll`, un timer pg-boss/Nest tourne encore et empêche le nouveau `Boss.start` de réquisitionner les jobs `expedition_arrival`/`combat_resolve`. Le 2e fichier boote OK mais ses workers n'attrapent jamais les jobs qu'il enqueue → `waitFor` timeout.

**Étapes suggérées pour la tentative 2** :
1. Reproduire de manière minimale : `jest --testPathPattern='army-training-read|combat-conquest-hook' --runInBand` doit échouer ; inverser l'ordre via un sequencer custom temporaire pour confirmer asymétrie.
2. Inspecter `bootSmokeApp.close` :
   - Augmenter `boss.stop({ timeout: 10_000 })` ou retirer le timeout.
   - Ajouter explicitement `await prisma.$disconnect()` ou vérifier que Nest le fait.
3. Ajouter au `truncateAll` (ou un nouvel helper `resetSmokeQueues`) : `TRUNCATE pgboss.job, pgboss.archive RESTART IDENTITY CASCADE` avant le boot du fichier suivant — bretelle complémentaire au DELETE actuel.
4. Auditer chaque worker pour confirmer que `OnModuleDestroy` clear les `setInterval`.
5. Si point 4 montre une fuite : c'est probablement la vraie cause racine.

## Critères de succès

- `yarn test:smoke` est reproductible : 5 runs consécutifs donnent le même résultat sans modification du code.
- Aucun smoke n'a besoin d'être re-run pour passer.
- `docs/architecture/local-ci.md` reflète la situation réelle (plus de flake documenté comme acquis).
- Décision pre-push smokes vs `/run` explicitée et actée dans la doc.
