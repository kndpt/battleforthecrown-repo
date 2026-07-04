# 90 — Index `tasks/README.md` périmé : liens cassés + statuts faux

**Sévérité** : 🟠 Moyen
**Statut** : ✅ DONE (2026-07-03)

## Symptôme

`tasks/README.md` est l'index chargé au démarrage de chaque run semi-autonome. Il présente comme **actifs / `PLANNED`** des tickets et runs qui sont en réalité tous `DONE` et déplacés dans `archive/`. Les liens correspondants sont **cassés** (ils pointent hors `archive/`).

Un agent qui lit l'index (ex. run planifié nocturne) croit à tort qu'il reste du travail non fait, ouvre les liens morts, et perd du temps à re-vérifier l'état réel via git/filesystem.

## Cause racine

Lors de l'archivage des runs/tickets concernés, l'entrée d'index n'a pas été basculée de son statut d'origine vers l'archive :

- **Section `## Tickets actifs`** : `66` et `57` listés actifs — les deux sont `DONE` (fichiers dans `tasks/archive/`). Liens cassés.
- **Section `### Runs actifs`** : quatre entrées `📋 PLANNED` obsolètes, liens cassés vers `./runs/<id>-...` :
  - `068` — **doublon** : une entrée `✅ DONE` archivée existe déjà plus bas (`### Runs archivés`).
  - `029` — **doublon** : entrée `✅ DONE` archivée déjà présente plus bas.
  - `052`, `050` — runs terminés (fiches dans `runs/archive/`) mais jamais rebasculés `DONE` dans l'index.

Total : 6 liens relatifs cassés sur 168 (audité script).

## Comportement attendu

- Aucun lien relatif cassé dans `tasks/README.md` (tous résolvent vers un fichier existant).
- Aucun ticket/run `DONE` présenté comme actif/`PLANNED`.
- `## Tickets actifs` reflète la réalité (backlog de tickets drainé → aucun actif).
- Pas de doublon d'entrée pour un même run.

## Scope recommandé

- `tasks/README.md` uniquement. Doc pure, aucun code.
- Déplacer `66`/`57` vers `## Archivés` (liens `archive/`, date de résolution réelle).
- Supprimer les entrées `PLANNED` doublons (`068`, `029`).
- Rebasculer `052`/`050` en `✅ DONE` avec lien `runs/archive/`.

## Critère de fin

`grep` des liens relatifs → 0 cassé. Aucune entrée `DONE` sous une section « actifs / PLANNED ».
