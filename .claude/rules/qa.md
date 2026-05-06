# QA — vérification de fin de tâche

À la fin de **toute tâche** qui touche au code, à la doc ou au gameplay (création de feature, modification, suppression, refactor, fix, audit, etc.), l'agent **doit** fournir une section QA.

## Principe absolu : la QA user doit être TRIVIALE

Le user est **testeur IN GAME, point**. Il fait des clics, navigue, refresh. **Rien d'autre.**

**Interdit** dans la checklist user :
- ❌ Commandes terminal (`yarn`, `docker`, `curl`, `psql`, etc.)
- ❌ Requêtes SQL ou inspection DB
- ❌ Lecture de logs backend
- ❌ Inspection DevTools Network / onglet WS / payloads
- ❌ Modification temporaire de code (instrumentation, commenter une ligne, etc.)
- ❌ Variables d'env, redémarrage du backend, override de timing
- ❌ Plus de **5 cases à cocher** par scénario. Si tu en as plus, c'est trop. Coupe.
- ❌ Plusieurs scénarios A/B/C/D… Garde **1 scénario principal** + max **1 edge case** si vraiment utile.

**Présumer que** : backend + frontend tournent déjà, le user a un compte/monde existant. Pas de section "Boot".

Si une vérif passe par un de ces moyens interdits, **c'est l'agent qui la fait lui-même** (Bash) et qui rapporte le résultat dans `## QA backend (vérifié par l'agent)`. Jamais le user.

## Décider du mode QA

| Cas | Qui teste | Format |
|---|---|---|
| Effet visible en jeu (UI Pixi, HUD React, gameplay) | **User** | `## QA` — checklist d'actions in-game **triviale** (≤ 5 cases). |
| Effet backend uniquement (endpoint, payload WS, état DB, logs, worker) — non visible côté front | **Agent** | `## QA backend (vérifié par l'agent)` — l'agent exécute curl/SQL/logs lui-même et rapporte. |
| Hybride (backend + impact UI) | **Les deux** | L'agent fait la partie backend lui-même + checklist triviale pour la partie in-game. |
| Aucun effet observable (refacto interne, doc) | Personne | `QA — pas de test nécessaire (raison : …)`. |

## Format — QA user (in-game)

```markdown
## QA

**Résultat attendu** : <une phrase, ce que tu dois voir en jeu>

- [ ] <action 1, un clic ou une nav>
- [ ] <action 2>
- [ ] Vérifier que <observation visuelle finale>
```

Max 5 cases. Si la feature a vraiment plusieurs comportements, choisir **le scénario le plus représentatif** et le mentionner comme tel — pas la peine d'exhaustivité.

## Format — QA backend (vérifiée par l'agent)

```markdown
## QA backend (vérifié par l'agent)

**Résultat attendu** : <ce qui devait se produire côté backend>

- [x] `curl …` → 201, payload OK
- [x] DB : `SELECT …` → ligne attendue
- [x] Logs : event `xxx.created` émis à T+~1s
```

Cases déjà cochées car **réellement exécutées** par l'agent (Bash tool). Pas par anticipation.

L'agent lance sa **propre instance backend** en background (port libre, ex `PORT=15002`) pour avoir les logs et stack traces. Pas l'instance du user.

**DB locale en QA backend = lecture seule.** Pour valider une garantie qui dépendrait d'un état DB invalide ou rare (drift de schéma, edge case), écrire un test unitaire avec fixture mockée — ne jamais `UPDATE` la DB du user pour reproduire le cas. Et ne jamais réappliquer un seed pour "restaurer" : un seed écrase la config dev (multipliers, etc.).

## Format — QA user (in-game)

```markdown
## QA

**Résultat attendu** : <une phrase qui décrit ce que le user doit observer en jeu>

- [ ] Action 1 — dans l'ordre exact où le user doit la faire
- [ ] Action 2
- [ ] Vérifier que <observation finale concrète>
```

## Format — QA backend (vérifiée par l'agent)

```markdown
## QA backend (vérifié par l'agent)

**Résultat attendu** : <ce qui devait se produire côté backend>

- [x] Démarré le backend sur le port 15001
- [x] `curl -X POST …` → 201 Created, payload `{ … }`
- [x] Vérifié en DB : `SELECT … FROM …` retourne la ligne attendue
- [x] Logs : event `xxx.created` émis par OutboxWorker à T+~1s
```

L'agent **exécute réellement** ces étapes (Bash tool) avant de cocher. Pas de cases cochées par anticipation.

## Règles de rédaction

- **Résultat attendu = observable**. "Le compteur de bois augmente après l'upgrade", pas "le code est correct".
- **Ordre chronologique**, une case = une action atomique.
- **Pas d'exhaustivité**. Un scénario représentatif suffit. L'edge case n'est ajouté que s'il est tout aussi simple à exécuter (ex : "refresh la page", oui ; "redémarrer le backend avec un env var", non).
- **EN français**.

## Exemple — QA user (in-game) ✅ bon niveau

> **Résultat attendu** : après l'upgrade d'une mine, le `+X/h` affiché à côté de la ressource correspondante augmente.
>
> - [ ] Sur ton village, lancer un upgrade de Lumberjack
> - [ ] Attendre la fin du chantier
> - [ ] Vérifier que le `+X/h` du bois a augmenté

3 cases, zéro outil technique. C'est ce qu'on veut.

## Exemple — QA backend (vérifiée par l'agent) ✅ bon niveau

> **Résultat attendu** : tout event `resources.changed` contient un `productionRates` non vide.
>
> - [x] Backend démarré, login → token récupéré
> - [x] `curl -X POST .../villages/:id/buildings/lumberjack/upgrade` → 201
> - [x] `SELECT payload->>'productionRates' FROM "EventOutbox" WHERE kind='resources.changed' ORDER BY id DESC LIMIT 1` → non NULL
> - [x] Edge case : tick worker (forcé en abaissant l'intervalle) → aucun nouveau event `resources.changed`

L'agent a tout exécuté lui-même. Le user n'a rien à faire ici — il lit juste le rapport.

## Anti-exemple ❌ ce qu'il ne faut PAS faire

> ~~1. Boot — `docker compose up -d` + `yarn prisma migrate deploy` + `start:dev` + `yarn pixi dev`~~
> ~~2. Trois scénarios A/B/C avec callers backend cités~~
> ~~3. DevTools → Network → WS → inspecter le payload de chaque event~~
> ~~4. Requête SQL dans la DB pour vérifier `payload->>'productionRates'`~~
> ~~5. Override `PRODUCTION_TICK_INTERVAL_MINUTES=1`, redémarrer, lire les logs~~
> ~~6. Commenter temporairement une ligne dans `crowns.service.ts`, lancer le build, vérifier que TS échoue~~

C'est un plan de test technique, pas un test user. Si l'agent a besoin de ces vérifs, il les fait lui-même et les rapporte dans `## QA backend (vérifié par l'agent)`.
