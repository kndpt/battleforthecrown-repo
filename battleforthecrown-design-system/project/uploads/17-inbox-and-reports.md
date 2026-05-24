# Inbox & rapports persistants

> ✅ **Contrat MVP.** Cette page fixe le périmètre minimal de l'inbox pour le MVP : héberger les rapports de combat persistants et les rapports de scout persistants. Les autres catégories et les fonctions avancées restent post-MVP.

## Pourquoi c'est obligatoire au MVP

Le **contenu** des rapports est décrit dans les docs concernées :

- Rapport de combat → [`04-combat.md`](./04-combat.md) + asymétrique pour les barbares ([`06-barbarians.md` § Rapport de combat](./06-barbarians.md#rapport-de-combat)).
- Rapport de scout → [`11-scouting.md`](./11-scouting.md).

Le **système** qui héberge ces rapports — l'inbox — est livré au MVP pour les rapports de combat persistants, puis étendu aux rapports de scout. Sur mobile, l'inbox d'un MMORTS est **l'écran le plus consulté** : c'est là que le joueur revient à chaque session pour vérifier ce qui s'est passé pendant son absence (raids subis, retours d'armée, scouts arrivés, conquêtes résolues). Les autres catégories restent à brancher dans leurs phases dédiées.

## Cible MVP

| Élément | Contrat Phase 2 |
| --- | --- |
| **Catégories** | Combat et scout. Conquête détaillée, push, serveur/Oyez et classements restent hors scope. |
| **Source de vérité** | `CombatReport` porte les rapports de combat. `ScoutReport` porte les rapports de scout. `EventOutbox` reste un canal temps réel, pas une archive métier. Pas de table `Report` transverse au MVP. |
| **Participants** | Un rapport PvP est partagé par le combat, mais l'état inbox est par participant : attaquant et défenseur ont chacun leur lu/non-lu et leur suppression. Un rapport barbare n'a qu'un participant joueur. |
| **Marquage** | Lu / non-lu persistant cross-device. Ouvrir le détail marque le rapport comme lu pour le joueur connecté uniquement. |
| **Badge** | Badge global "messages" = nombre de rapports non lus du joueur connecté dans les catégories branchées à l'inbox (combat, scout). Il se met à jour après lecture, refetch, reconnexion et événement temps réel. |
| **Tri** | Liste triée du plus récent au plus ancien. |
| **Accès** | Le joueur connecté voit uniquement les rapports combat où il est attaquant ou défenseur, et les rapports scout dont il est propriétaire, sauf entrée supprimée pour lui. |
| **Suppression manuelle** | Suppression unitaire conservée au MVP. Elle masque l'entrée pour le joueur courant ; le rapport physique peut rester tant qu'un autre participant y a accès ou qu'un retour d'armée peut encore le référencer. Supprimer le rapport ne doit jamais bloquer la restitution des survivants/loot. |
| **Rétention / capacité** | Pas de purge automatique ni cap au MVP. À réouvrir post-MVP après playtest. |
| **Filtres / recherche / pin** | Hors scope MVP. La première version peut afficher une seule liste de rapports. |
| **REST minimal** | Combat : `GET /combat/reports`, `GET /combat/report/:id`, `PATCH /combat/report/:id/read`, `DELETE /combat/report/:id`. Scout : `GET /combat/scout-reports`, `GET /combat/scout-report/:id`, `PATCH /combat/scout-report/:id/read`, `DELETE /combat/scout-report/:id`. |
| **Temps réel minimal** | Une résolution de combat invalide l'inbox via WS : `battle.resolved` côté attaquant, `village.attacked` côté défenseur. Un scout arrivé invalide l'inbox via `scout.reported`; son retour émet `scout.returned`. Le frontend refetch REST ensuite. |

Modèle de référence post-MVP : Tribal Wars / Kingsage gardent les rapports ~30 jours par défaut, avec tags/favoris/archive et un cap de capacité. Ce n'est pas requis pour la Phase 2 initiale.

## Articulation avec les notifications push

L'inbox et les notifications push (cf. [`16-notifications.md`](./16-notifications.md)) sont **complémentaires** :

- **Push** = signal court (« quelque chose est arrivé, ouvre l'app »).
- **Inbox** = lecture détaillée et historique persistant.

Un push qui pointe sur un rapport doit ouvrir l'app **directement sur ce rapport**, pas sur un écran neutre — sinon l'utilisateur perd l'info qu'on vient de l'inciter à consulter. À spécifier dans la spec finale.

## Liens

- [`04-combat.md`](./04-combat.md) — contenu du rapport de combat.
- [`06-barbarians.md` § Rapport de combat](./06-barbarians.md#rapport-de-combat) — variante asymétrique côté barbare.
- [`11-scouting.md`](./11-scouting.md) — contenu du rapport de scout.
- [`16-notifications.md`](./16-notifications.md) — push, déclencheur naturel d'une lecture inbox.
- [`docs/architecture/realtime.md`](../architecture/realtime.md) — pattern Outbox (source potentielle des entrées d'inbox).
