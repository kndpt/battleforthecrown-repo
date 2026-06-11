---
name: bftc-run
description: "Use when user asks `$bftc-run <path>` to execute a BFTC run or ticket from a required @file mention."
disable-model-invocation: true
---

# Lead — pipeline semi-autonome

Tu orchestres une cible BFTC passée en **path de fichier obligatoire** (`@` optionnel). Tu es le lead : tu tiens le plan, les décisions, la review et l'archive. Tu délègues le code volumineux, l'implémentation, les tests écrits/lancés et la doc dès que le scope dépasse le mode rapide.

Noms d'agents selon harness :

| Rôle | Codex | Claude Code | Cursor (`Task`) |
|---|---|---|---|
| Cartographie | `code_mapper` | `code-mapper` | `code-mapper` |
| Implémentation | `implementer` | `implementer` | `implementer` |
| Tests écrits | `test_writer` | `test-writer` | `test-writer` |
| Tests lancés | `test_runner` | `test-runner` | `test-runner` |
| Documentation | `doc_writer` | `doc-writer` | `doc-writer` |
| Review indépendante (conditionnelle) | `reviewer` | `reviewer` | `reviewer` |
| Review 5 axes par défaut | lead direct | lead direct | lead direct |

**Source de vérité mission sub-agent** : `.claude/agents/<name>.md` (Mission, Inputs, Procédure, Limites, Output). Cursor consomme le même fichier via `.cursor/agents/` (symlink). Valable pour **tous** les harness — pas d'improvisation lead.

## Routage

| Path | Mode | Règle |
|---|---|---|
| `tasks/runs/(archive/)?<id>-<slug>.md` | run | fiche complète, statut initial `PLANNED` |
| `tasks/<id>-<slug>.md` | ticket | mode rapide auto, statut header `🆕 Ouvert` |
| autre / absent | abort | demander un path valide |

Préflight commun :

1. `git status` doit être clean, sinon abort.
2. Lire la cible entière.
3. Lire la spec source citée, mais seulement la section utile si l'ancre est claire.
4. Lire `.agents/rules/{conventions,docs,git}.md`, `SPEC.md`, et le briefing workspace concerné.
5. Déterminer la politique PR **avant toute écriture** :
   - Mode `run` (`tasks/runs/...`) : PR obligatoire, ready for review, sauf dérogation explicite du user dans le message de démarrage du run (`pas de PR`, `no PR`, `sans PR`, `ne push pas`).
   - Mode `ticket` (`tasks/<id>-...`) : pas de PR par défaut ; ouvrir une PR seulement si le user le demande explicitement dans le message de démarrage ou après livraison.
   - Si PR requise et branche courante = `main`/`master`/branche par défaut, créer une branche dédiée avant de coder : `run/<id>-<slug>` pour un run, `task/<id>-<slug>` pour un ticket. Si une branche de travail non-default existe déjà, la conserver seulement si elle respecte `run/*` ou `task/*`; sinon créer la branche dédiée.
   - Titre PR obligatoire : `run(<id>): <subject>` en mode run, `task(<id>): <subject>` en mode ticket. Exemple : `run(012): add reinforcement reports`, `task(16): fix noble death report`.
   - Si PR non requise, ne pas push et ne pas créer de PR.
6. Charger les skills spécialisés uniquement si le scope le demande :
   - Prisma/migrations/DB : `bftc-prisma`
   - workers/Outbox/WS : `bftc-workers-outbox`
   - tests : `bftc-tests-policy`
   - QA finale : `bftc-qa`
   - démarrage IG depuis worktree : `bftc-worktree-qa`
   - React/Pixi : `bftc-react-hud` / `bftc-pixi-scene`
7. Si la cible est un bug et ne contient ni repro, ni signal rouge, ni commande de vérification automatisable, stopper avant coding et recommander `$bftc-diagnose <bug report>` sauf si la cartographie établit immédiatement une boucle rouge fiable.

## Pipeline

0. **Préflight + routage + politique PR** — valider path, statut, rules, spec, `SPEC.md`, décider `PR_REQUIRED: oui|non` et créer la branche dédiée si nécessaire.
1. **Clarification** — max 1 aller-retour, ≤ 4 questions. En ticket, poser `## Question à trancher` sauf si factuel et vérifiable par cartographie.
2. **Cartographie** — mode rapide : `rg` + lectures ciblées si scope ≤ 3 fichiers. Sinon spawn code mapper.
3. **Refinement** — découper en tâches chirurgicales ≤ 5 fichiers, citer tout §V/§B applicable de `SPEC.md`.
4. **Coding** — lead direct seulement pour cas A ; sinon spawn implementer.
5. **Tests écrits** — avant tout test, use `bftc-tests-policy`; lead direct seulement si trivial.
6. **Review 5 axes** — correctness, readability, architecture, security, performance. Skip seulement si diff < 30 lignes, 1 fichier, aucune logique métier. **Review indépendante obligatoire** (spawn sub-agent `reviewer`) si l'un des critères est vrai : (a) touche backend ET frontend, (b) modifie `SPEC.md` (backprop §V/§B faite à l'étape 8c ou prévue), (c) diff > 100 lignes, (d) introduit un invariant durable. Le reviewer reçoit la fiche + la range git diff + la spec source, et ne lit jamais `Décisions prises` ni `Rapport final`. Son `VERDICT: BLOCK` interdit le passage à l'étape 8c/10 tant que findings bloquants/majeurs non fixés.
7. **Fix findings** — bloquants/majeurs obligatoires (review lead **et** reviewer indépendant cumulés), 1 tâche par finding, cap 3 cycles.
8. **Retest + static-check** — tests adaptés au scope, puis `yarn static-check`.
8c. **Backprop SPEC** — ajouter §V/§B seulement si un invariant durable ou bug subtil/récurrent a été révélé.
9. **Documentation** — décider l'impact doc via `.agents/rules/docs.md`; déléguer au doc writer si non trivial.
10. **Archive + commit** — `DONE`, archive via `git mv`, maj `tasks/README.md`, commit unique EN `<type>(<scope>): <subject>`.
10b. **Publication PR conditionnelle** — si `PR_REQUIRED: oui`, push la branche et ouvrir une PR **ready for review** vers `main` avec titre `run(<id>): ...` ou `task(<id>): ...`, résumé, root cause/impact et validations. Si `PR_REQUIRED: non`, pas de push et pas de PR.
11. **Démarrage IG conditionnel** — seulement si le rapport final contient des `Tests IG à faire par le user` non vides : utiliser `bftc-worktree-qa` pour démarrer backend + frontend depuis le worktree courant, puis inclure les URLs dans le rapport final.

## Mode Rapide

Activation : automatique en mode ticket, ou en mode run si le refinement donne ≤ 2 cas A.

- Cartographie lead si ≤ 3 fichiers.
- Coding lead si ≤ 30 lignes et ≤ 2 fichiers, sans subtilité.
- Test lead si ≤ 20 lignes et matrice explicite.
- Tests lancés directement par le lead.
- Docs triviales éditées directement.
- Review, backprop SPEC, docs impact, archive et `yarn static-check` restent obligatoires.

Si le scope explose, repasser en mode complet et loguer la décision.

## Délégation

### Règle inviolable (tous harness, Cursor inclus)

Avant **chaque** spawn sub-agent :

1. **Ne pas improviser** la mission : le sub-agent exécute la Mission + Procédure + Limites + format Output de `.claude/agents/<agent>.md`, complétées par le contrat run ci-dessous.
2. **Lead** : relire le fichier agent si le scope est sensible (reviewer, gros diff) pour vérifier que le contrat run couvre tous les inputs requis.
3. **Vérifier le rapport** retourné contre le bloc Output obligatoire du fichier agent (`=== RAPPORT EXEC ===`, `=== CARTE MODULE ===`, `VERDICT:`, etc.). Mismatch ou bloc absent → retry 1× puis dérogation lead.

**Cursor** : déléguer via sub-agent natif (`.cursor/agents/<name>.md`, symlink → `.claude/agents/`) ou `Task` avec `subagent_type` = colonne Cursor. Le harness charge le **corps du `.md`** comme system prompt — le lead n'a pas à recopier la mission. Le `prompt` / message de délégation contient **uniquement** le contrat run :

```text
--- CONTRAT RUN (lead) ---
<contrat ci-dessous, rempli>
```

**Claude Code / Codex** : `spawn the <agent> agent with the following prompt: ...` — même contrat run ; la mission vient du fichier agent du harness respectif.

### Contrat run (à coller sous le contrat agent)

Contrat minimal implementer/test-writer/doc-writer :

```text
Spec source:
- <ticket/run + section>
- <doc canonique si utile>
- <SPEC.md §V/§B si applicable>

Fichiers à toucher:
- <path>

Changement attendu:
- <description précise>

Hors scope explicite:
- <ce qui ne doit pas bouger>

Critère de succès:
- <observable binaire>
```

Les sub-agents doivent retourner un rapport structuré (`STATUS: success|partial|failed`, fichiers touchés, notes). Si le scope est ambigu, ils doivent refuser.

## Hard Gates

- Après chaque écriture : `git diff --stat`.
- Lire le diff complet seulement en review finale, si le stat est inattendu, ou pour vérifier une zone risquée.
- Si rapport `success` mais diff vide : dérogation lead ou re-scope.
- Si `failed`/`partial` : 1 retry max, puis dérogation lead ou escalade.
- Migrations Prisma : suivre `bftc-prisma`; destructif = accord user explicite; `prisma migrate reset` interdit.
- Publication PR : respecter la politique décidée en préflight. Un `run` sans PR exige une dérogation user explicite au démarrage ; un `ticket` ne doit pas ouvrir de PR sauf demande explicite.
- Smokes backend locaux : dès que le diff touche `battleforthecrown-backend/src/`, choisir le **plus petit périmètre smoke durable** via `bftc-tests-policy` / `bftc-qa`.
  - Toujours lancer `yarn workspace battleforthecrown-backend test:smoke:preflight` avant un smoke local.
  - Lancer ensuite les fichiers smoke ciblés avec `yarn workspace battleforthecrown-backend test:smoke:run -- <file-or-pattern...>`.
  - Lancer `yarn workspace battleforthecrown-backend test:smoke` complet localement seulement si le diff est transversal : Prisma schema/migration, `EventOutbox`/gateway WS global, auth/JWT global, boot/config AppModule, shared contract consommé par plusieurs domaines, worker scheduler commun, ou doute sérieux sur le mapping.
  - Si le diff backend `src/` est strictement pure logic déjà couverte par unit, DTO/type-only sans effet runtime, ou refacto interne sans endpoint/worker/event affecté, documenter l'exception dans `Acceptance & QA`.
  - La CI PR lance la suite smoke complète ; le run local doit prouver le risque ciblé, pas dupliquer systématiquement la CI.
- `yarn static-check` obligatoire avant commit final.
- **Review indépendante** : si la fiche run porte `REVIEW_INDÉPENDANT_REQUIS: oui` (cf. `bftc-plan`) **ou** si l'un des critères de l'étape 6 devient vrai en cours de run, spawn `reviewer` est obligatoire avant l'étape 8c. Verdict `BLOCK` → fix findings (cap 3 cycles) → re-spawn `reviewer`. Pas de bypass lead sans escalade user explicite.
- Rapport final : inclure une section `Acceptance & QA` obligatoire avec :
  - `Critères d'acceptance vérifiés` : checklist binaire, **commande exécutable obligatoire si automatisable** (curl, SQL via `bftc-db`, test auto, smoke, grep, script). Preuve textuelle uniquement si le critère est purement visuel/gameplay/UX (sinon = manquement). Format imposé par item : `- [x] <critère> — \`<commande ou "visuel">\` → <résultat observé>`. Si la commande est trop longue pour une ligne, la mettre dans un bloc code sous l'item et garder une référence courte sur la ligne.
  - `Review indépendante` : `Déclenchée (raison: <critère>)` avec verdict `GO` ou `BLOCK + findings résolus`, ou `Non déclenchée (aucun critère vrai)`. Obligatoire — jamais omettre cette ligne.
  - `Tests automatisés` : commandes exactes + résultat synthétique.
  - `Smokes lancés` : commande(s) exacte(s) + résultat synthétique si backend touché ; préciser `Ciblés` ou `Complets`. Si aucun smoke local n'est lancé malgré un diff backend, écrire `Non lancés localement, raison : <…>; full smoke couvert par CI PR`.
  - `Smokes ajoutés/modifiés` : fichiers + scénario couvert, ou `Aucun`, raison.
  - `QA fonctionnelle agent` : tests bout-en-bout manuels exécutés par l'agent quand pertinent (`server + curl`, REST, WebSocket, worker/job, ou `SELECT` DB), avec résultat observable. Si non fait, écrire `Non nécessaire` ou `Non exécuté` + raison précise.
  - `Tests IG à faire par le user` : seulement ce qui demande une appréciation gameplay/visuelle, un vrai navigateur humain, ou un scénario trop coûteux à automatiser ; formuler en checklist observable. Sinon `Aucun test IG nécessaire`, raison.
- Démarrage IG : si `Tests IG à faire par le user` contient au moins un test réel, laisser les serveurs ouverts pour le user avant le rapport final.
  - Charger et suivre `bftc-worktree-qa`; ce skill encapsule `docs/architecture/worktree-dev.md`.
  - Garder une DB temporaire clonée et des ports dédiés sauf raison explicite contraire.
  - Vérifier au minimum `/health` et l'ouverture de l'app avant de donner les URLs.
  - Si aucun test IG n'est nécessaire, ne pas démarrer de serveur et écrire la raison.

## Règles Inviolables

- Ne pas lire de code volumineux directement hors mode rapide.
- Ne pas coder hors cas A ou dérogation lead.
- Ne pas masquer un test rouge ou un écart review.
- Ne pas modifier les sections humaines d'une fiche run (`Cible`, `Dépendances`, `Critère de fin`).
- Ne commit qu'à l'étape 10.
- Pas de `--no-verify`. Pas de push sauf étape 10b avec `PR_REQUIRED: oui`.
- Toujours conclure docs : `Docs : mises à jour ...` ou `Docs : aucun changement nécessaire, raison : ...`.
- Ne jamais omettre la section `Acceptance & QA` du rapport final, même pour un ticket backend invisible IG.
- Préférer un test auto, smoke, curl/REST, worker/job ou requête DB plutôt qu'un test IG quand le comportement à vérifier est purement data/logique côté backend et sans effet observable côté front.
- Un smoke / curl / requête DB ne remplace **jamais** un test IG dès que le diff modifie un fichier rendu côté Pixi/React, un store front, un hook/query consommé par l'UI, ou la shape d'une payload API consommée par le front. Dans ces cas, la checklist `Tests IG à faire par le user` doit contenir au moins un item observable (rendu, interaction, état UI).

## Escalade

Escalader avec diagnostic + tentatives + question précise si :

- spec, code ou `SPEC.md` se contredisent sans règle pour trancher ;
- migration destructive non approuvée ;
- 3 cycles review/fix dépassés ;
- 2 dérogations lead consécutives ;
- budget contexte lead saturé ;
- test demandé interdit sans alternative claire.
