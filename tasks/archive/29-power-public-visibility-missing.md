# 29 — Puissance publique (village + royaume) non exposée

**Sévérité** : 🟡 Majeure
**Statut** : ✅ Résolu 2026-05-10 par `$bftc-run @tasks/29-power-public-visibility-missing.md` (issue de [run 000](../runs/archive/000-pilote-audit-power.md))

## Symptôme

La spec [`09-power-and-rankings.md` § Visibilité](../../docs/gameplay/09-power-and-rankings.md#visibilité) déclare deux informations comme **publiques** :

- Puissance Village (bâtiments) — *« Visible pour tous (information publique) »*
- Puissance Royaume — *« Visible pour tous »*

Le code actuel n'expose **aucune** de ces deux valeurs publiquement :

- `battleforthecrown-backend/src/modules/power/power.controller.ts:13-22` — `GET /power?villageId=…` est protégé par `assertVillageOwnedBy` (`power.service.ts:20`). Un joueur ne peut donc consulter que la puissance de **ses propres** villages.
- `battleforthecrown-backend/src/modules/power/power.controller.ts:38-41` — `GET /power/kingdom` consomme `@CurrentUser()` et appelle `getKingdomPower(user.id)` ; pas de paramètre pour cibler un autre joueur, donc inaccessible aux tiers.

Conséquence gameplay : un attaquant ne peut pas estimer la difficulté d'une cible avant attaque comme la spec le prévoit (cf. [§ Utilisation stratégique](../../docs/gameplay/09-power-and-rankings.md#utilisation-stratégique) : *« la puissance bâtiments est publique, ce qui permet d'estimer la difficulté d'une attaque sans espion »*).

## État actuel

| Endpoint | Auth | Sortie | Conformité INV |
| --- | --- | --- | --- |
| `GET /power?villageId=…` | propriétaire seul | `{ total, buildings, army }` | partiel (INV-1, 2, 3) — viole INV-5 (publique) car non accessible aux tiers |
| `GET /power/kingdom` | utilisateur courant uniquement | `{ kingdomPower, … }` | partiel (INV-4) — viole INV-7 (publique) car non accessible aux tiers |
| `GET /power/leaderboard` | `@Public()` | liste de villages avec `total/building/army` | hors scope (Classements post-MVP) ; viole INV-6 en exposant `army` indirectement, à reprendre lors du rework classements |

## Pistes

### Piste A — Étendre les endpoints existants en mode dégradé pour les tiers

`getVillagePower(villageId, requesterUserId)` :

- Si `requesterUserId` possède le village → comportement actuel (`{ total, buildings, army }`).
- Sinon → vérifier l'appartenance du village à un user (pas un barbare) puis retourner `{ buildings }` uniquement (pas de `army`, pas de `total` qui pourrait inférer l'armée par soustraction).

Idem pour `getKingdomPower(targetUserId, requesterUserId)` : la spec dit que la Puissance Royaume est publique → on peut la retourner telle quelle (`Σ Puissance villages`), même pour un tiers. Attention : techniquement la Puissance Royaume = `Σ (bâtiments + armée)`, donc l'exposer publiquement révèle indirectement `Σ armée` à l'échelle du royaume (un attaquant peut inférer la masse d'armée totale en faisant `kingdomPower − Σ buildings publics`). Discordance interne de la spec à signaler.

**Tradeoff** : minimal en surface API (mêmes routes) ; sémantique de retour variable selon le caller (DTO non stable). Le client doit gérer 2 formes de réponse.

### Piste B — Nouveaux endpoints publics dédiés

- `GET /power/village/:id/public` (ou `/public/power/village/:id`) → `{ buildings }`.
- `GET /power/kingdom/:userId/public` → `{ kingdomPower }`.

Endpoints existants restent "vue propriétaire" (auth requise, sortie complète).

**Tradeoff** : DTOs stables ; double surface API (4 routes au lieu de 2). Plus simple à documenter.

### Piste C — Endpoint unifié avec discriminant côté serveur

`GET /power/village/:id` toujours, mais le service retourne un payload conditionnel : public minimal pour les tiers, complet pour le propriétaire. Identique à la piste A mais formalisé via un DTO union typé (`PublicVillagePower | OwnerVillagePower`).

**Tradeoff** : unifie A en clarifiant le contrat. Frontend doit narrow le type ; documentation OpenAPI plus lourde.

## Question à trancher

1. **Accepter la fuite indirecte d'armée** via la Puissance Royaume publique ? Si oui (spec dit "visible pour tous"), MAJ2 est trivial. Si non, on doit redéfinir Puissance Royaume comme « Σ Puissance Bâtiments des villages » (cohérent avec INV-6).
2. **Choisir une piste** (A / B / C) pour exposer la puissance bâtiments d'un village tiers.
3. Faut-il **bloquer la lecture** sur les villages barbares (qui ont `userId = null`) ou les exposer aussi publiquement ? La spec ne le précise pas.
4. **Rate-limit** sur les endpoints publics (anti-scraping de leaderboard) ? Hors périmètre power-only mais à anticiper.

## Référence audit

Run pilote 000 — `## Décisions prises § T3` (écarts MAJ1 et MAJ2).

## Résolution

- Piste B retenue : endpoints publics dédiés, sans modifier les routes propriétaire existantes.
- `GET /power/village/:villageId/public` retourne `{ villageId, buildings }` pour villages joueurs et barbares, sans `army` ni `total`.
- `GET /power/kingdom/:userId/public` retourne `{ userId, kingdomPower }`.
- Fuite indirecte de puissance armée agrégée via `kingdomPower` acceptée par arbitrage produit.
- Rate-limit hors scope.
