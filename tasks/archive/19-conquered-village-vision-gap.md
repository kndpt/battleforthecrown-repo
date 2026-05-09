# 19 — Village conquis sans vision propre

**Sévérité** : 🟠 Moyenne
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Décision** : règle stricte au MVP. Vision = union des disques Watchtower du joueur. Pas de mini-rayon par défaut, pas de Watchtower offerte. Le joueur doit construire (~15 min lvl 1) sur la nouvelle conquête barbare.

**Constats** :
- Doc PvP (`14-pvp-conquest.md`) : déjà cohérente — bâtiments hérités tels quels, donc Watchtower aussi (si défenseur en avait une).
- Doc barbare (`13-barbarian-conquest.md`) : tableau § Bâtiments matérialisés disait déjà *« Tour de guet ❌ — joueur la construit »*, mais la conséquence vision n'était documentée que pour T5.
- Code : `conquest.service.ts` gardait **tous** les bâtiments à la conquête barbare, ce qui aurait laissé une Watchtower lvl 4 à un T3 conquis (template T3 inclut une Watchtower). Divergence runtime ↔ spec.

**Code modifié** :
- `battleforthecrown-backend/src/modules/combat/conquest.service.ts` : à la conquête barbare, suppression explicite de la Watchtower (`tx.building.deleteMany({ type: 'WATCHTOWER' })`). Aligne le runtime avec la doc *« Watchtower jamais matérialisée à la conquête »*.

**Docs mises à jour** :
- `docs/gameplay/13-barbarian-conquest.md` § Conséquences concrètes : nouveau sous-§ « Vision propre = 0 (tous tiers barbares) » qui généralise au-delà de T5 + lien vers la mécanique vision globale.
- `docs/gameplay/14-pvp-conquest.md` § Population : ajout d'un sous-§ « Vision » qui précise que la Watchtower est héritée comme tout bâtiment PvP, contrastée avec le cas barbare.

**Note** : `ConquestService.conquerVillage` n'est appelé nulle part en runtime aujourd'hui (flow conquête pas encore câblé au combat resolver). Le fix code prévient un bug latent quand l'appel sera ajouté.

## Symptôme

`docs/gameplay/13-barbarian-conquest.md:25` — Tour de guet **non matérialisée** à la conquête barbare.

`docs/gameplay/01-overview.md:88` — vision = union des disques de toutes les Watchtowers du joueur.

Conséquence : si le village conquis sort du rayon des Watchtowers du village d'origine, l'attaquant est **aveugle sur sa propre nouvelle conquête** dès qu'elle est trop loin. Pas explicite dans la doc.

## Question à trancher

- Au MVP, conserver règle stricte (vision = union Watchtowers) → joueur doit construire vite la Watchtower lvl 1 (~15 min) sur la nouvelle conquête.
- Ou bien : tout village du joueur émet par défaut un mini-rayon (1-2 cases) sans Watchtower ?

Documenter le comportement choisi dans `13-barbarian-conquest.md` + `14-pvp-conquest.md` (cas village PvP qui hérite Watchtower vs pas).
