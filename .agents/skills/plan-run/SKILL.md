---
name: plan-run
description: Génère un draft de fiche de run BFTC depuis la roadmap MVP et l'écrit dans `tasks/runs/` après validation user. Délègue l'analyse à l'agent `run_planner`, présente le draft, attend validation, écrit la fiche en statut `PLANNED`. Use when user asks `$plan-run <description>` (ex `$plan-run audit du module crowns`).
disable-model-invocation: true
---

# Lead — Planification de run

Ton job : produire une fiche de run prête à lancer (statut `PLANNED`) pour le sujet décrit en argument, **sans** exécuter le run lui-même (`$run` le fait plus tard).

> **Pour spawn un sub-agent** : dis explicitement « spawn the `<name>` agent with the following prompt: ... » et attends son résultat avant de continuer.

## Étape 1 — Préflight

1. Vérifie `git status` clean (pas critique mais signale au user si dirty).
2. Lis `tasks/00-mvp-roadmap.md` pour avoir le contexte des phases.
3. Lis `tasks/runs/README.md` pour le format de fiche attendu.
4. Identifie le **prochain ID disponible** : `ls tasks/runs/*.md tasks/runs/archive/*.md` → max ID + 1, formaté en 3-digit (ex : si max = 002, prochain = 003).

## Étape 2 — Délégation à `run_planner`

Spawn the **`run_planner`** agent avec le prompt :

- **Description** : la description fournie par l'utilisateur, telle quelle.
- **Indice de phase** (si tu l'identifies en lisant la roadmap) : phase suggérée.

Reçois son bloc `=== DRAFT FICHE RUN ===`. Le draft contient : `ID_SUGGÉRÉ`, `SLUG_SUGGÉRÉ`, `TYPE`, `PHASE_ROADMAP`, `CIBLE`, `DÉPENDANCES`, `CRITÈRES_ACCEPTANCE`, `DÉCOMPOSITION_INITIALE`, `POINTS_D_ATTENTION`, `ESTIMATION_SCOPE`, `NOTES`.

## Étape 3 — Présentation au user pour validation

Affiche le draft au user dans un format lisible (markdown rendu, pas le bloc brut). Pose ensuite la question :

> Le draft te convient-il ?
> 1. OK, écris la fiche
> 2. Ajuster avant écriture (réponds avec ce qu'il faut changer)
> 3. Annuler

Si « Ajuster » : attends ses modifications, applique-les sur le draft (toi, dans ta tête), reboucle au début de l'étape 3 (re-présente, repose la question). Cap 3 cycles d'ajustement avant escalade.

## Étape 4 — Écriture de la fiche

Une fois validé :

1. **Crée** `tasks/runs/<id>-<slug>.md` en utilisant le **template** de `tasks/runs/README.md` § Template, rempli avec les valeurs du draft.
2. Statut → `PLANNED`. `Démarré` → `—`. `Terminé` → `—`.
3. Sections dynamiques (`## Progress`, `## Décisions prises`, `## Rapport final`) restent vides avec marqueur `_(Vide au démarrage. …)_`.
4. **Mets à jour `tasks/README.md`** :
   - Section « Runs (exécutions semi-autonomes) » : ajoute la ligne `- [<id> — <slug humain>](./runs/<id>-<slug>.md) — 📋 \`PLANNED\`. <description courte>`.
   - Si la section affichait « Aucun run actif. », remplace cette ligne par la nouvelle.

## Étape 5 — Récap final

Rends la main au user avec un récap court (≤ 8 lignes) :
- ID + slug créés.
- Type, phase roadmap.
- Liens : la fiche, le skill pour lancer (`$run <id>`).
- Points d'attention si présents.
- Pas de commit (le user décide).

## Règles inviolables

- **Tu ne lances pas le run.** `$plan-run` ne fait que créer la fiche. C'est `$run <id>` qui exécute.
- **Tu ne crées pas la fiche sans validation user.** Étape 3 obligatoire.
- **Tu ne devines pas le scope.** Si `run_planner` retourne `ESTIMATION_SCOPE: large` avec une note de segmentation, propose au user de découper en plusieurs runs avant écriture.
- **Tu n'écris pas la fiche dans `archive/`** — toujours `tasks/runs/<id>-<slug>.md` (statut `PLANNED`).
- **Pas de `git commit`.** Le user décide.

## Cas d'escalade

- Le sujet ne correspond à **aucune phase** de la roadmap → demande au user si c'est intentionnel (run hors-roadmap acceptable mais à acter).
- `run_planner` retourne `STATUS: failed` ou un draft incohérent → re-spawn 1 fois avec un prompt plus précis, sinon escalade au user.
- 3 cycles d'ajustement dépassés sans convergence → escalade au user.
