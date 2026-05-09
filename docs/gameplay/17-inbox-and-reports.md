# Inbox & rapports persistants

> 🚧 **Doc en chantier.** Spec à détailler plus tard. Cette page existe pour acter que le **système d'inbox** entre dans le scope **MVP** — l'analyse design (rétention, filtres, marquage, archivage, capacité) viendra dans une seconde passe.

## Pourquoi c'est obligatoire au MVP

Le **contenu** des rapports est déjà décrit dans les docs concernées :

- Rapport de combat → [`04-combat.md`](./04-combat.md) + asymétrique pour les barbares ([`06-barbarians.md` § Rapport de combat](./06-barbarians.md#rapport-de-combat)).
- Rapport de scout → [`11-scouting.md`](./11-scouting.md).

Mais le **système** qui héberge ces rapports — l'inbox — n'existe pas encore. Or sur mobile, l'inbox d'un MMORTS est **l'écran le plus consulté** : c'est là que le joueur revient à chaque session pour vérifier ce qui s'est passé pendant son absence (raids subis, retours d'armée, scouts arrivés, conquêtes résolues). Sans un système structuré, les rapports se perdent et l'asymétrie temporelle (cf. [`16-notifications.md`](./16-notifications.md)) reste irrésolue côté lecture.

## Cible MVP — esquisse

| Élément | Question à trancher |
| --- | --- |
| **Catégories** | Combat (attaquant/défenseur séparés ?), scout, retour d'armée, conquête (succès/échec/interruption), événements serveur (Oyez, raid barbare global), classements ? |
| **Rétention** | Durée de conservation par catégorie (7 j ? 30 j ? infini avec cap de capacité ?). Suppression auto ou opt-in ? |
| **Capacité** | Plafond par joueur (ex : 200 rapports max) avec rotation FIFO ? Ou illimité avec compression côté DB ? |
| **Marquage** | Lu / non-lu, badge global et par catégorie. Persistance cross-device. |
| **Filtres** | Par catégorie, par village ciblé, par interlocuteur (joueur ennemi / barbare). Recherche texte ? Probablement pas au MVP. |
| **Archivage / pin** | Possibilité d'épingler un rapport important (ex : rapport scout à conserver pour préparer une attaque) hors de la rotation. |
| **Suppression manuelle** | Suppression unitaire + suppression de masse par filtre. |
| **Source de vérité** | Table Prisma dédiée (`Report` ?) ou réutilisation de `EventOutbox` archivé ? À trancher avec l'architecture. |

Modèle de référence : Tribal Wars / Kingsage gardent les rapports ~30 jours par défaut, avec un système de tags (favori, archive) et un cap de capacité (~500 rapports). C'est la cible UX raisonnable.

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
