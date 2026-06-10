# Inbox & rapports persistants

> ✅ **Contrat MVP.** Cette page fixe le périmètre minimal de l'inbox pour le MVP : héberger les rapports de combat persistants, les rapports de scout persistants, les rapports de renfort persistants et les rapports de caravane persistants. Les autres catégories et les fonctions avancées restent post-MVP.

## Pourquoi c'est obligatoire au MVP

Le **contenu** des rapports est décrit dans les docs concernées :

- Rapport de combat → [`04-combat.md`](./04-combat.md) + asymétrique pour les barbares ([`06-barbarians.md` § Rapport de combat](./06-barbarians.md#rapport-de-combat)).
- Rapport de scout → [`11-scouting.md`](./11-scouting.md).
- Rapport de renfort → voir § [Catégorie renfort](#catégorie-renfort) ci-dessous.
- Rapport de caravane → voir § [Catégorie caravane](#catégorie-caravane) ci-dessous.

Le **système** qui héberge ces rapports — l'inbox — est livré au MVP pour les rapports de combat persistants, puis étendu aux rapports de scout, de renfort et de caravane. Sur mobile, l'inbox d'un MMORTS est **l'écran le plus consulté** : c'est là que le joueur revient à chaque session pour vérifier ce qui s'est passé pendant son absence (raids subis, retours d'armée, scouts arrivés, conquêtes résolues, livraisons de ressources). Les autres catégories restent à brancher dans leurs phases dédiées.

## Cible MVP

| Élément | Contrat Phase 2 |
| --- | --- |
| **Catégories** | Combat, scout, renfort et caravane. Conquête détaillée, push, serveur/Oyez et classements restent hors scope. |
| **Source de vérité** | `CombatReport` porte les rapports de combat. `ScoutReport` porte les rapports de scout. `ReinforcementReport` porte les rapports de renfort. `CaravanReport` porte les rapports de caravane. `EventOutbox` reste un canal temps réel, pas une archive métier. Pas de table `Report` transverse au MVP. |
| **Participants** | Un rapport PvP est partagé par le combat, mais l'état inbox est par participant : attaquant, défenseur et observateur de capture éventuel ont chacun leur lu/non-lu et leur suppression. Un rapport barbare n'a qu'un participant joueur, sauf pendant une capture où l'occupant joueur peut être défenseur ; il n'a jamais de propriétaire original observateur. Pour le renfort et la caravane, l'état inbox est porté par `InboxEntry` (une ligne par destinataire unique). |
| **Marquage** | Lu / non-lu persistant cross-device. Ouvrir le détail marque le rapport comme lu pour le joueur connecté uniquement. |
| **Badge** | Badge global "messages" = nombre de rapports non lus du joueur connecté dans les catégories branchées à l'inbox (combat, scout, renfort, caravane). Il se met à jour après lecture, refetch, reconnexion et événement temps réel. |
| **Tri** | Liste triée du plus récent au plus ancien. |
| **Accès** | Le joueur connecté voit uniquement les rapports combat où il est attaquant, défenseur ou observateur de capture, les rapports scout dont il est propriétaire, et les entrées `InboxEntry` qui lui sont adressées (renfort, caravane) — sauf entrée masquée. |
| **Suppression manuelle** | Suppression unitaire conservée au MVP. Elle masque l'entrée pour le joueur courant ; le rapport physique peut rester tant qu'un autre participant y a accès ou qu'un retour d'armée ou de caravane peut encore le référencer. Supprimer le rapport ne doit jamais bloquer la restitution des survivants/loot ni la libération des porteurs. Pour le renfort et la caravane : `DELETE` passe `InboxEntry.hidden = true`, ne supprime jamais le rapport physique ni ne bloque le retour. |
| **Rétention / capacité** | Pas de purge automatique ni cap au MVP. À réouvrir post-MVP après playtest. |
| **Filtres / recherche / pin** | Hors scope MVP. La première version peut afficher une seule liste de rapports. |
| **REST minimal** | Combat : `GET /combat/reports`, `GET /combat/report/:id`, `PATCH /combat/report/:id/read`, `DELETE /combat/report/:id`. Scout : `GET /combat/scout-reports`, `GET /combat/scout-report/:id`, `PATCH /combat/scout-report/:id/read`, `DELETE /combat/scout-report/:id`. Renfort : `GET /combat/reinforcement-reports`, `GET /combat/reinforcement-report/:id`, `PATCH /combat/reinforcement-report/:id/read`, `DELETE /combat/reinforcement-report/:id`. Caravane : `GET /combat/caravan-reports`, `GET /combat/caravan-report/:id`, `PATCH /combat/caravan-report/:id/read`, `DELETE /combat/caravan-report/:id`. |
| **Temps réel minimal** | Une résolution de combat invalide l'inbox via WS : `battle.resolved` côté attaquant, `village.attacked` côté défenseur et observateur de capture éventuel. Un scout arrivé invalide l'inbox via `scout.reported`; son retour émet `scout.returned`. Pour le renfort : l'inbox renfort se rafraîchit via les events existants `garrison.added` (arrivée STATIONED, côté owner hôte) et `reinforcement.returned` (RETURNED, côté owner origine). Pour la caravane : l'inbox caravane se rafraîchit via `caravan.arrived` (livraison arrivée) et `caravan.returned` quand `recalled=true` (retour rappelé). Aucun rapport n'est créé par `caravan.sent`. La fin de capture utilise `village.capture-window-completed` et `village.conquered`. Le frontend refetch REST ensuite. |

Modèle de référence post-MVP : Tribal Wars / Kingsage gardent les rapports ~30 jours par défaut, avec tags/favoris/archive et un cap de capacité. Ce n'est pas requis pour la Phase 2 initiale.

### Catégorie capture/conquête

Les rapports de capture restent dans la catégorie combat au MVP, sans table `Report` transverse. La matrice détaillée vit dans [`14-pvp-conquest.md` § Matrice des rapports inbox de capture](./14-pvp-conquest.md#matrice-des-rapports-inbox-de-capture).

Contrats inbox durables :

- `CombatReport.observerUserId` sert uniquement au propriétaire original d'un village joueur pendant une capture contestée. Son état est isolé via `readByObserver` / `hiddenByObserver`.
- Une attaque pendant une fenêtre ouverte produit un rapport partagé par l'assaillant, l'occupant qui défend la garnison et, si applicable, le propriétaire original observateur.
- Un village barbare en capture n'a pas de propriétaire original : aucun rapport observateur n'est créé.
- La finalisation réussie crée un rapport final persistant partagé par le conquérant et l'ancien propriétaire joueur distinct ; un village barbare ne crée que le rapport du conquérant.
- L'inbox doit libeller ces cas sans UUID brut : `Attaque`, `Défense de capture`, `Capture contestée`, `Capture réussie`, `Capture perdue`.

## Catégorie renfort

### Wording joueur

| Type | Libellé affiché |
| --- | --- |
| `STATIONED` | "Arrivé en soutien" — un renfort a rejoint la garnison d'un village hôte. |
| `RETURNED` | "Retour au village" — un renfort est rentré à son village d'origine (suite à un Rappeler ou Renvoyer). |

Un rappel en-route (renfort jamais stationné, demi-tour avant arrivée) ne génère pas de rapport de renfort.

### Frontière ReinforcementReport / InboxEntry / EventOutbox

Ces trois entités ont des rôles distincts et **ne doivent pas être confondues** :

| Entité | Rôle | Archive ? |
| --- | --- | --- |
| `ReinforcementReport` | Fait métier persistant d'un mouvement de renfort (`STATIONED` ou `RETURNED`). Capture qui a envoyé quoi, où, quand. | Oui — ne disparaît pas quand un joueur masque son entrée. |
| `InboxEntry` | État par destinataire : lu/non-lu, masqué. Une ligne par destinataire unique. Lié au `ReinforcementReport` via FK nullable avec `onDelete Cascade`. | Non — reflète uniquement l'état de lecture d'un joueur. |
| `EventOutbox` | Canal temps réel uniquement. Porte les events `garrison.added` et `reinforcement.returned` qui déclenchent l'invalidation inbox côté front. | Non — pas d'archive métier. |

L'`InboxEntry` est dédoublonnée : si l'owner du village d'origine et l'owner du village hôte sont le même joueur (cas mono-joueur aujourd'hui, `initiateReinforce` interdit le renfort inter-joueurs), une seule ligne `InboxEntry` est créée.

Pour les champs exacts, voir [`battleforthecrown-backend/prisma/schema.prisma`](../../battleforthecrown-backend/prisma/schema.prisma) et [`docs/architecture/data-model.md`](../architecture/data-model.md).

## Catégorie caravane

### Wording joueur

| Type | Libellé affiché |
| --- | --- |
| `ARRIVED` | "Livraison arrivée" — une caravane a livré des ressources dans le village destinataire. |
| `RETURNED` | "Caravane rappelée" — une caravane rappelée est rentrée au village d'origine. |

Un envoi de caravane (`caravan.sent`) ne génère pas de rapport persistant : c'est un signal temps réel court. Le retour normal après livraison ne génère pas non plus de rapport supplémentaire ; le fait métier consultable reste l'arrivée, avec les ressources créditées et perdues par overflow. Le retour rappelé génère un rapport parce qu'il restitue les ressources à l'origine et peut perdre l'excédent si l'Entrepôt d'origine est plein.

### Frontière CaravanReport / InboxEntry / EventOutbox

| Entité | Rôle | Archive ? |
| --- | --- | --- |
| `CaravanReport` | Fait métier persistant d'un mouvement de caravane (`ARRIVED` ou `RETURNED`). Capture origine, destination, ressources transportées, créditées, restituées ou perdues, porteurs et timestamp. | Oui — ne disparaît pas quand un joueur masque son entrée. |
| `InboxEntry` | État par destinataire : lu/non-lu, masqué. Une ligne par destinataire unique. Lié au `CaravanReport` via FK nullable avec `onDelete Cascade`. | Non — reflète uniquement l'état de lecture d'un joueur. |
| `EventOutbox` | Canal temps réel uniquement. Porte `caravan.arrived` et `caravan.returned` pour déclencher l'invalidation inbox côté front. | Non — pas d'archive métier. |

Les caravanes MVP sont intra-joueur : origine et destination appartiennent au même joueur. L'`InboxEntry` est donc créée une seule fois pour ce joueur, avec déduplication défensive si le modèle évolue.

## Articulation avec les notifications push

L'inbox et les notifications push (cf. [`16-notifications.md`](./16-notifications.md)) sont **complémentaires** :

- **Push** = signal court (« quelque chose est arrivé, ouvre l'app »).
- **Inbox** = lecture détaillée et historique persistant.

Un push qui pointe sur un rapport doit ouvrir l'app **directement sur ce rapport**, pas sur un écran neutre — sinon l'utilisateur perd l'info qu'on vient de l'inciter à consulter. À spécifier dans la spec finale.

## Liens

- [`04-combat.md`](./04-combat.md) — contenu du rapport de combat.
- [`06-barbarians.md` § Rapport de combat](./06-barbarians.md#rapport-de-combat) — variante asymétrique côté barbare.
- [`11-scouting.md`](./11-scouting.md) — contenu du rapport de scout.
- [`02-economy-and-progression.md`](./02-economy-and-progression.md#caravane-de-ressources-entre-ses-propres-villages) — règles de caravane de ressources.
- [`16-notifications.md`](./16-notifications.md) — push, déclencheur naturel d'une lecture inbox.
- [`docs/architecture/data-model.md`](../architecture/data-model.md) — entités `ReinforcementReport`, `CaravanReport`, `InboxEntry`, `Expedition.reinforcementRecallActorUserId`.
- [`docs/architecture/realtime.md`](../architecture/realtime.md) — pattern Outbox ; invalidation inbox renfort/caravane via events métier existants.
