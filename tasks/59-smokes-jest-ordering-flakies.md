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

## Critères de succès

- `yarn test:smoke` est reproductible : 5 runs consécutifs donnent le même résultat sans modification du code.
- Aucun smoke n'a besoin d'être re-run pour passer.
- `docs/architecture/local-ci.md` reflète la situation réelle (plus de flake documenté comme acquis).
- Décision pre-push smokes vs `/run` explicitée et actée dans la doc.
