# QA — vérification de fin de tâche

À la fin de **toute tâche** (feature, fix, refactor, doc, audit), l'agent doit fournir une section QA.

## Décider du mode QA

| Cas | Qui teste | Section |
|---|---|---|
| Effet visible en jeu (UI Pixi, HUD, gameplay) | **User** | `## QA` — actions in-game uniquement |
| Effet backend uniquement (endpoint, WS payload, DB, logs, worker) | **Agent** | `## QA backend (vérifié par l'agent)` — curl/SQL/logs exécutés par l'agent |
| Hybride (backend + impact UI) | **Les deux** | sections agent + user |
| Aucun effet observable runtime (helper privé, doc, typage interne) | Personne | `QA — pas de test nécessaire (raison : …)` |

**Piège « refacto interne »** : `aucun effet observable` ≠ `j'ai changé que du backend`. Tout code path consommé par le front (controller, gateway WS, Outbox event, worker émetteur, script de boot) est **hybride par défaut** — une régression silencieuse (ordre, side-effect, gestion d'erreur) est invisible côté agent mais visible IG.

## QA user (in-game) — TRIVIALE

Le user fait des **clics in-game, point**. Pas de terminal, SQL, logs, DevTools, modif de code, env vars. Si une vérif passe par un de ces moyens, **c'est l'agent qui la fait** dans `## QA backend`.

```markdown
## QA

**Résultat attendu** : <une phrase, ce que tu dois voir en jeu>

- [ ] <action 1, un clic ou une nav>
- [ ] <action 2>
- [ ] Vérifier que <observation visuelle>
```

Règles : ≤ 5 cases, 1 scénario principal + max 1 edge case si trivial, ordre chronologique, FR. Présumer que backend + frontend tournent déjà et que le user a un compte/monde existant — pas de section "Boot".

## QA backend (vérifiée par l'agent)

```markdown
## QA backend (vérifié par l'agent)

**Résultat attendu** : <ce qui devait se produire côté backend>

- [x] `curl …` → 201, payload OK
- [x] DB : `SELECT …` → ligne attendue
- [x] Logs : event `xxx.created` émis à T+~1s
```

Cases cochées **après exécution réelle** par l'agent (Bash). Pas par anticipation.

L'agent lance sa **propre instance** sur port libre (`PORT=15002`) — pas celle du user. **DB locale = lecture seule** : pour reproduire un état rare, écrire un test unitaire avec fixture, jamais `UPDATE` sur la DB du user. Ne jamais réappliquer un seed pour "restaurer" (écrase la config dev).

## Recettes QA backend

### Boot / teardown (port 15002)

```bash
cd battleforthecrown-backend && PORT=15002 yarn start:dev > /tmp/bftc-qa.log 2>&1 &
until grep -q "Nest application successfully started" /tmp/bftc-qa.log; do sleep 1; done
# … QA …
pkill -f "PORT=15002"
```

Boot qui échoue → compile error, souvent un caller obsolète (`scripts/` inclus). Lire `/tmp/bftc-qa.log`.

### Auth express

```bash
curl -s -X POST http://localhost:15002/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-'$(date +%s)'@test.com","password":"secret123"}'
# → { "accessToken", "refreshToken", "userId", "email" }
```

⚠️ Endpoint `/auth/register` (pas `/signup`). Champ `accessToken` (pas `access_token`).

### Endpoints fréquents

| Action | Endpoint |
|---|---|
| Créer compte | `POST /auth/register` |
| Login | `POST /auth/login` |
| Joindre monde + 1er village | `POST /world/:worldId/join` `{villageName}` |
| Upgrade building | `POST /villages/:id/buildings/:type/upgrade` |
| Recruter troupes | `POST /army/villages/:id/train` |
| Lancer attaque | `POST /combat/attack` |

Pour le reste : grep `@Controller`/`@Post`/`@Get` dans `battleforthecrown-backend/src/modules/*/controller.ts`.

### DB et cleanup

- Lecture DB → skill `bftc-db` (tables `lower_snake_case`).
- Nettoyer **uniquement** les fixtures créées par l'agent (ex : `email LIKE 'qa-%'`). Jamais les données du user.

## Exemple QA user — bon niveau

> **Résultat attendu** : après l'upgrade d'une mine, le `+X/h` à côté de la ressource augmente.
>
> - [ ] Lancer un upgrade de Lumberjack
> - [ ] Attendre la fin du chantier
> - [ ] Vérifier que le `+X/h` du bois a augmenté

3 cases, zéro outil technique. Si tu te retrouves à écrire "boot le backend", "DevTools Network", "SELECT", "redémarrer avec env var" → c'est `## QA backend`, pas `## QA`.
