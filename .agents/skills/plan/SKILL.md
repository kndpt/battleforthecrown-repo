---
name: plan
description: "Use when user asks `$plan <input>` to triage a sujet (bug, feature, idée, phase roadmap, spec gameplay) into either a ticket or a run fiche, après validation user."
disable-model-invocation: true
---

# Lead — Planification (triage ticket vs run)

Ton job : transformer un sujet **vague ou cadré** en un artefact prêt à exécuter (`$run @path`), au bon endroit. Tu décides toi-même si c'est un **ticket** (`tasks/<id>-<slug>.md`) ou une **fiche de run** (`tasks/runs/<id>-<slug>.md` statut `PLANNED`). Tu **n'exécutes pas** — `$run` le fera plus tard.

Ce skill est la source de vérité commune Claude Code + Codex. Sub-agent utilisé :

| Rôle | Codex | Claude Code |
|---|---|---|
| Cartographie + draft | `run_planner` | `run-planner` |

> **Pour spawn un sub-agent** : dis explicitement « spawn the `<name>` agent with the following prompt: ... » et attends son résultat avant de continuer.

## Trois formes d'invocation

| Forme | Exemple | Préflight additionnel |
|---|---|---|
| **Path roadmap + section** | `$plan @tasks/00-mvp-roadmap.md Phase 6` | Lire la phase ciblée et ses dépendances en amont |
| **Path spec gameplay/archi** | `$plan @docs/gameplay/14-pvp-conquest.md` | Lire la spec entière, confronter au code existant |
| **Description libre** | `$plan la vision multi-village ne marche pas` | `rg` agressif sur keywords, identifier fichiers candidats |

Toutes passent par la **même mécanique** : préflight → cartographie via `run_planner` → triage → validation user → écriture.

## Étape 1 — Préflight

1. Identifier la forme d'invocation (path roadmap / path spec / description libre).
2. `git status` — non bloquant, mais signaler au user si dirty.
3. Lire `tasks/README.md` et `tasks/runs/README.md` pour connaître les conventions et templates.
4. Identifier le **prochain ID disponible** :
   - Pour un futur **ticket** : `ls tasks/*.md tasks/archive/*.md` → max ID + 1.
   - Pour une future **fiche de run** : `ls tasks/runs/*.md tasks/runs/archive/*.md` → max ID + 1.
   - Tu ne sais pas encore lequel sera retenu — calcule les deux, choisis après triage.
5. Lecture additionnelle selon la forme :
   - **roadmap** : lire la section de phase + phases en amont citées en dépendance.
   - **spec** : lire la spec entière.
   - **libre** : laisser le `run_planner` faire la cartographie initiale.

## Étape 2 — Délégation au run planner

Spawn the **run planner** (`run_planner` côté Codex, `run-planner` côté Claude Code) avec le prompt :

- **Forme d'input** : `roadmap-phase` | `spec` | `description-libre`.
- **Input brut** : ce que l'utilisateur a tapé.
- **Contexte de phase** (si roadmap) : section ciblée + dépendances lues.
- **Mission** :
  1. Cartographier le scope (signatures, fichiers candidats, callers, tests existants).
  2. Émettre un draft structuré.
  3. Émettre un **verdict d'artefact** explicite : `ARTEFACT: ticket` ou `ARTEFACT: run`, avec justification basée sur les critères ci-dessous.

Le draft doit contenir :

```
=== DRAFT ===
ARTEFACT: ticket | run
RAISON_ARTEFACT: <1-3 phrases citant les critères qui ont tranché>

ID_SUGGÉRÉ: <id 3-digit pour un ticket, ou 3-digit pour un run>
SLUG_SUGGÉRÉ: <kebab-case-en>
TYPE: bug | refacto | feature | audit | doc | spec
PHASE_ROADMAP: <numéro + nom, ou "Hors roadmap">
SPEC_AMONT: <lien vers `docs/...` ou `Aucune`>

SYMPTÔME / OBJECTIF: <description claire>
CAUSE_RACINE_PROBABLE: <si bug/refacto, sinon `Sans objet`>
SCOPE_ESTIMÉ:
  - Backend: <fichiers candidats>
  - Frontend: <fichiers candidats>
  - Shared/Docs: <fichiers candidats>
PISTES: <A, B, C... si plusieurs options de design, sinon `Une seule piste évidente`>
DÉCOMPOSITION_INITIALE: <si run, sous-tâches chirurgicales ≤ 5 fichiers>
CRITÈRES_ACCEPTANCE: <checklist observable et binaire>
POINTS_D_ATTENTION: <pièges, dérives possibles, dépendances cachées>
ESTIMATION_SCOPE: small | medium | large
NOTES: <reste libre>
```

Si `ESTIMATION_SCOPE: large` avec note de segmentation, tu proposeras au user de découper avant écriture (cf. étape 3).

## Étape 3 — Présentation au user pour validation

Affiche le draft au user dans un format lisible (markdown rendu, pas le bloc brut). **Mets en évidence** :

1. `ARTEFACT` retenu + raison.
2. ID + slug + type.
3. Scope estimé et pistes si plusieurs.

Pose ensuite la question :

> Le draft te convient-il ?
> 1. OK, écris l'artefact
> 2. Ajuster avant écriture (réponds avec ce qu'il faut changer)
> 3. Contester le verdict `ARTEFACT` (force ticket ou run, motiver)
> 4. Découper en plusieurs runs/tickets (si `ESTIMATION_SCOPE: large`)
> 5. Annuler

Si « Ajuster » : applique les modifications sur le draft, reboucle au début de l'étape 3. Cap 3 cycles d'ajustement avant escalade.

Si « Contester » : applique le verdict utilisateur (le user a la décision finale sur l'artefact). Note dans le récap final que le verdict a été contesté + la raison.

Si « Découper » : produit la liste des artefacts à créer, propose au user :
- Écrire tous les artefacts d'un coup en `PLANNED`.
- Écrire seulement le premier, écrire les suivants à la demande.

## Étape 4 — Écriture de l'artefact

### Cas `ARTEFACT: ticket`

1. **Crée** `tasks/<id>-<slug>.md` avec la structure organique habituelle (cf. tickets existants comme `tasks/54-*.md`, `tasks/57-*.md`, `tasks/58-*.md`) :

   ```markdown
   # <id> — <titre humain>

   **Sévérité** : 🟡 Majeur | 🟠 Moyen | 🟢 Mineur
   **Statut** : 🆕 Ouvert
   **Spec amont** : <lien ou rien>

   ## Symptôme | Problème

   <ce qui est observé ou ce qu'on cherche à résoudre>

   ## Cause racine probable

   <hypothèse étayée par la cartographie, ou `Sans objet` pour une feature>

   ## Comportement attendu

   <checklist d'observables>

   ## Pistes

   <A / B / C si plusieurs options, sinon section omise>

   ## Scope recommandé

   ### Backend / Frontend / Tests / Docs (selon)

   <sous-listes ciblées>

   ## Critères de succès

   <checklist binaire>
   ```

2. **Met à jour `tasks/README.md`** section « Tickets actifs » : ajoute la ligne `- [<id> — <titre humain>](./<id>-<slug>.md) — <sévérité>. <description courte>` (1 phrase max).

### Cas `ARTEFACT: run`

1. **Crée** `tasks/runs/<id>-<slug>.md` en utilisant le **template** de [`tasks/runs/README.md` § Template](../../tasks/runs/README.md#template), rempli avec les valeurs du draft.
2. Statut → `PLANNED`. `Démarré` → `—`. `Terminé` → `—`.
3. Sections dynamiques (`## Progress`, `## Décisions prises`, `## Rapport final`) restent vides avec marqueur `_(Vide au démarrage. …)_`.
4. **Met à jour `tasks/README.md`** :
   - Section « Runs actifs » : ajoute la ligne `- [<id> — <slug humain>](./runs/<id>-<slug>.md) — 📋 \`PLANNED\`. <description courte>`.
   - Si la section affichait « Aucun run actif. », remplace cette ligne par la nouvelle.

## Étape 5 — Récap final

Rends la main au user avec un récap court (≤ 10 lignes) :

- Artefact retenu : `ticket` ou `run`, raison.
- Path créé.
- Type, phase roadmap (ou Hors roadmap).
- Liens : la fiche, la commande pour exécuter (`$run @<path>`).
- Points d'attention si présents.
- Pas de commit (le user décide).

## Triage — critères explicites

Le `run_planner` doit appliquer ces critères. Si **AU MOINS UN** est vrai → `ARTEFACT: run`. Sinon → `ARTEFACT: ticket`.

| Critère | Justification |
|---|---|
| Touche backend **et** frontend simultanément | Coordination interface → review 5 axes critique, doc archi probable |
| Introduit un invariant durable (backprop SPEC obligatoire) | Mérite la fiche de run pour traçabilité de la décision |
| Demande une décision archi entre 2+ pistes design | Validation user en étape 3 du `$run` indispensable |
| > 4 fichiers estimés au scope | Au-delà, le mode rapide n'est plus sûr |
| Impact non trivial sur `docs/architecture/` | Demande passage `doc-writer` |
| Phase entière de la roadmap (Phase 6, 7, etc.) | Toujours un run (et souvent à découper en plusieurs) |

Tous les autres cas → `ARTEFACT: ticket` (bug ciblé, refacto local, ajout endpoint trivial, fix UI bornée, doc isolée).

## Règles inviolables

- **Tu ne lances pas le run.** `$plan` ne fait que créer l'artefact. C'est `$run @path` qui exécute.
- **Tu ne crées pas l'artefact sans validation user.** Étape 3 obligatoire.
- **Tu n'écris jamais une fiche de run dans `archive/`** — toujours `tasks/runs/<id>-<slug>.md` (statut `PLANNED`).
- **Tu n'écris jamais un ticket dans `archive/`** — toujours `tasks/<id>-<slug>.md` (statut `🆕 Ouvert`).
- **Tu n'inventes pas un ID** — toujours `max(existing) + 1` dans le dossier cible (tickets ou runs).
- **Pas de `git commit`.** Le user décide.
- **Le user a le dernier mot sur `ARTEFACT`** — si le verdict est contesté, applique la décision user et logue-le.

## Cas d'escalade

- Le sujet ne correspond à **aucune phase** de la roadmap → continuer en `Hors roadmap`, signaler au user (run hors-roadmap acceptable mais à acter).
- Le `run_planner` retourne `STATUS: failed` ou un draft incohérent → re-spawn 1 fois avec un prompt plus précis, sinon escalade au user.
- 3 cycles d'ajustement dépassés sans convergence → escalade au user.
- `ESTIMATION_SCOPE: large` sans plan de découpe clair → demander au user comment segmenter avant écriture.
