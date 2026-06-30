# Inactivité & abandon de compte

> 🚧 **Doc en chantier — feature post-MVP.** Cette page existe pour acter le seuil retenu (**2 semaines sans login = abandon**) et lister les questions à trancher plus tard. Pas de scope MVP : on accepte que des comptes-zombies squattent quelques slots de carte le temps des premiers playtests.

## Pourquoi cette doc

[`01-overview.md` § Monde persistant](./01-overview.md#monde-persistant-et-raids) mentionne que *« les barbares peuvent reprendre un village abandonné »* sans définir l'abandon. Sans seuil précis et sans mécanique de retour à la barbarie, on se retrouve à terme avec :

- des **comptes-zombies** qui occupent des emplacements stratégiques sans jouer,
- du **matchmaking faussé** (puissance figée, classements pollués),
- de la **frustration** côté voisins actifs (cible inattaquable car protégée par `puissance ÷ 3`, ou simplement morne).

## Décidé

**Seuil d'abandon : 2 semaines (14 jours) sans login.** Au-delà, le compte est considéré abandonné et ses villages basculent vers un mécanisme de retour à la barbarie (à spécifier).

## Questions à trancher (post-MVP)

| Question | Piste |
| --- | --- |
| Tier barbare cible | Quel tier reprend un village abandonné ? Mapping selon le niveau du Château au moment du basculement ? Cf. [`06-barbarians.md` § Tiers](./06-barbarians.md). |
| Retour du joueur | Un joueur qui se reconnecte après 14 j peut-il reprendre ses villages gratuitement (cf. mécanique de ruines, [`01-overview.md`](./01-overview.md#monde-persistant-et-raids)) ou doit-il les reconquérir via le flux barbare standard ? |
| Affichage carte | ✅ **Tranche livrée (run 087)** : indicateur d'inactivité pré-abandon `ACTIVE \| INACTIVE` dérivé en lecture seule de `WorldMembership.lastLoginAt` (seuil **7 j**, aligné sur le filtre actifs de `crown-production.worker.ts`), exposé sur la fiche publique joueur (`GET …/public-profile` → champ `inactivity`) et rendu via un badge gris discret « Inactif depuis N j » dans `PublicPlayerProfileSheet`. **Non destructif** : aucun worker, mutation, migration ni grisage du village dans le canvas. Helper pur `computeInactivityState` (`packages/shared/src/world/inactivity.ts`). Le basculement J+14 reste hors scope. |
| Notification au joueur inactif | Mail / push « ton royaume est en danger, reconnecte-toi » à J+10 ? Hors scope MVP, cf. [`16-notifications.md`](./16-notifications.md). |
| Effet sur les classements | Compte abandonné gelé ou retiré des [classements](./24-rankings.md) ? |
| Effet sur les ressources et armée | Stock conservé / reset au moment du basculement ? Armée garnison conservée et utilisable contre l'attaquant qui vient piller ? Aligné sur la spec de [conquête barbare](./13-barbarian-conquest.md) ou cas particulier ? |
| Granularité | Bascule **tous** les villages d'un coup, ou un par un selon une règle (le moins défendu en premier) ? |

## Pourquoi 2 semaines

Cible standard du segment MMORTS mobile (Tribal Wars, Kingsage, Lords Mobile) : 14 jours est le **plus court délai au-delà duquel l'absence est jugée non récupérable** sans que le joueur perde son investissement progression de manière brutale. 7 jours = trop court (vacances, examens, deuil). 30 jours = trop long (zombies persistent, slots gelés). 14 jours = tradeoff retenu.

## Liens

- [`01-overview.md` § Monde persistant](./01-overview.md#monde-persistant-et-raids) — mention initiale du retour à la barbarie.
- [`06-barbarians.md`](./06-barbarians.md) — tiers et templates barbares (cible du basculement).
- [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) — conquête barbare (mécanique potentiellement réutilisée pour reprendre un village abandonné).
- [`07-barbarian-spawning.md`](./07-barbarian-spawning.md) — algorithme de spawn barbare (pourrait absorber les villages abandonnés).
