# Alliances & tribus

> 🚧 **Doc en chantier — strictement post-MVP.** Le système complet d'alliances (tribu, chat, bannière, diplomatie, guerre coordonnée) sort du scope MVP. Cette page existe pour parquer les questions et différencier le sujet du compromis MVP **liste d'amis défensifs** ([`20-defensive-friends.md`](./20-defensive-friends.md)).

## Pourquoi cette doc

Le PvP de tribu est **l'âme du segment** (Tribal Wars, Kingsage, Lords Mobile). Le reporter au post-MVP est un choix de scope assumé — pas une absence d'intention design. Sans alliances :

- pas de **défense collective** structurée,
- pas de **diplomatie** (pacte, déclaration de guerre, neutralité),
- pas de **coordination offensive** (attaques synchronisées sur une même cible),
- pas de **classement collectif** (la pression des classements reste individuelle).

Le compromis MVP est une **liste d'amis défensifs** ultra-restreinte (renforts uniquement, cap 5) — voir [`20-defensive-friends.md`](./20-defensive-friends.md). Elle ne remplace **pas** un vrai système d'alliances, elle évite juste le pire (le solo écrasé par 3 voisins coordonnés).

## Sujets à traiter (post-MVP)

| Domaine | Questions |
| --- | --- |
| **Création / cycle de vie** | Cap de membres ? Règle de fondation (Couronnes ? Bâtiment dédié type « Hôtel de tribu » ?) ? Dissolution ? Fusion ? Migration de membres ? |
| **Hiérarchie** | Roi / Duc / Membre ? Permissions (inviter, exclure, déclarer guerre) ? Vote ? |
| **Communication** | Chat tribu intégré ? Messages privés ? Annonces du chef ? Modération ? |
| **Diplomatie** | Pactes (NAP), guerres déclarées, neutralité, vassalité ? Effet mécanique (interdiction d'attaque, partage de vision, renforts illimités) ? |
| **Coordination offensive** | Attaques groupées synchronisées (multiple armées convergent à la même heure) ? Outil dédié dans l'UI ? |
| **Coordination défensive** | Renforts inter-membres (déjà esquissé dans la liste d'amis MVP, à étendre sans cap) ? Vision partagée des disques de tour de guet ? |
| **Classements collectifs** | Classement de tribus (puissance cumulée, conquêtes cumulées, points de guerre) ? Récompenses spécifiques ? |
| **Bouclier débutant et alliances** | Un nouveau joueur peut-il rejoindre une tribu sous bouclier ? Les renforts de tribu cassent-ils le bouclier comme une attaque PvP sortante ([`14-pvp-conquest.md` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde)) ? |
| **Conquête PvP et alliances** | Les alliés du défenseur peuvent-ils intervenir pendant la fenêtre de capture (cf. [`14-pvp-conquest.md` § Acteurs autorisés](./14-pvp-conquest.md#acteurs-autorisés-à-attaquer-pendant-la-fenêtre) qui prévoit déjà un slot post-MVP pour ça) ? |
| **Inactivité et alliances** | Un compte abandonné ([`18-inactivity-and-abandonment.md`](./18-inactivity-and-abandonment.md)) reste-t-il dans la tribu ? Quel effet sur les permissions ? |
| **Cycle de vie d'un monde et alliances** | Une alliance survit-elle au wipe d'un monde ([`19-world-lifecycle.md`](./19-world-lifecycle.md)) ? Méta-progression d'alliance entre saisons ? |
| **UX dédiée** | Écran tribu (membres, statuts, diplomatie, chat, classement interne). C'est typiquement le 2e ou 3e écran le plus consulté en MMORTS — investissement UX significatif. |

## Modèles de référence

- **Tribal Wars / Kingsage** : tribu jusqu'à ~50 membres, chat interne, déclaration de guerre formelle, classement de tribus, attaques coordonnées via outil dédié.
- **Lords Mobile** : guildes très grosses (~100), guerres territoriales (Royaume vs Royaume), chat permanent, méta-événements.
- **Clash of Clans** : clan de 50 membres, guerres de clans cycliques, donations de troupes très utilisées (= équivalent enrichi de la liste d'amis).

→ Le modèle exact à retenir devra être tranché à l'ouverture du chantier post-MVP, après observation du PvP émergent en playtest MVP.

## Liens

- [`20-defensive-friends.md`](./20-defensive-friends.md) — compromis MVP (renforts uniquement, cap 5).
- [`14-pvp-conquest.md`](./14-pvp-conquest.md) — PvP de conquête, qui prévoit déjà des hooks post-MVP pour les alliés (intervention pendant la fenêtre de capture, etc.).
- [`19-world-lifecycle.md`](./19-world-lifecycle.md) — cycle de vie d'un monde (durée, wipe — impact direct sur la longévité d'une alliance).
- [`09-power-and-rankings.md`](./09-power-and-rankings.md) — classements (potentiel ajout d'une catégorie collective post-MVP).
- [`01-overview.md` § Extensions post-MVP](./01-overview.md#extensions-post-mvp) — où la mention « Alliances / Tribus » figure déjà comme post-MVP.
