# 04 — Population incohérente entre design et code

**Sévérité** : 🔴 Critique
**Workspace(s)** : `packages/shared`, `battleforthecrown-backend`, `docs/gameplay`
**Tags** : population, economy, balance, progression

## Symptôme

La documentation décrit la population comme le limiteur stratégique fondamental entre bâtiments et armée, avec une progression jusqu'au niveau 10. Le code partagé ne définit pourtant que les limites de population des niveaux 1 à 5 et retombe sur la valeur minimale pour les niveaux absents.

## Localisation

- `packages/shared/src/village/population.ts:1-8` — limites population uniquement pour les niveaux 1 à 5.
- `packages/shared/src/village/population.ts:13-15` — fallback vers `FARM_POPULATION_LIMITS[minLevel]` quand le niveau n'existe pas.
- `battleforthecrown-backend/src/modules/world/world-config.service.ts:117-119` — le backend consomme `getFarmPopulationLimit`.
- `docs/gameplay/02-economy-and-progression.md:25-63` — population décrite comme trade-off stratégique central.
- `docs/gameplay/02-economy-and-progression.md:77-89` — table design jusqu'à 1100 population cumulée au niveau 10.

## Détail

Si un Farm niveau 6+ est interrogé, le helper actuel peut retourner la population du niveau 1 au lieu d'une progression haute. Ce comportement est très éloigné de la vision qui fait de la population une ressource de long terme. Il peut aussi fausser l'équilibrage des unités, des bâtiments et de la conquête.

## Impact gameplay

- Le mid/late game peut se retrouver artificiellement bloqué ou incohérent.
- Les coûts population des bâtiments/unités ne peuvent pas être évalués correctement.
- Le choix "infrastructure vs armée" risque d'être cassé par une limite trop basse ou imprévisible.
- Les joueurs peuvent percevoir la Farm comme un bâtiment inutile au-delà d'un certain point.
- Toute analyse de balance basée sur la doc devient suspecte tant que le code diverge.

## Questions ouvertes

- Les niveaux 6 à 10 sont-ils intentionnellement non supportés aujourd'hui ?
- Le fallback vers le niveau 1 est-il voulu ou seulement un comportement par défaut technique ?
- Les données stockées en DB peuvent-elles déjà contenir des Farm niveau 6+ ?
- Les coûts population actuels des bâtiments et unités ont-ils été calibrés contre la table doc ou contre la table code ?

## Tickets liés

- [11 — Objectif 50/50 production-pillage non garanti par les systèmes actuels](./11-production-raiding-balance-unproven.md)
- [12 — Multi-village et conquête encore peu porteurs dans le code actif](./12-multivillage-conquest-loop-not-active.md)
