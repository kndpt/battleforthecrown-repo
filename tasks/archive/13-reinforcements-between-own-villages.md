# 13 — Renforts entre mes propres villages

**Sévérité** : 🟡 Majeure
**Statut** : ✅ Résolu 2026-05-09 (spec — implémentation MVP à venir)

## Résolution

**Décision** : autorisé au MVP, **trajet combat-like** (modèle Tribal Wars / Kingsage). Pas d'instantané (casserait l'arbitrage géographique), pas d'interdit (casserait les compositions multi-village `12-village-styles.md`).

**Règles tranchées** :
- Action « Renforcer » distincte d'« Attaquer ». Cible = village possédé par le joueur.
- Durée = distance × vitesse de l'unité la plus lente (idem raid).
- Pas de combat en chemin (cohérent avec « pas d'interception »).
- Rappel possible pendant l'aller (idem raid).
- Pas de combat à l'arrivée — les troupes sont stationnées dans le village hôte.
- Population reste consommée par le village d'origine.
- Pertes en défense → pop libérée pour le village d'origine (cohérent avec ticket 20).
- Bonus de style suit la troupe (déjà tranché par 12-village-styles.md).
- Exception : aucun renfort/retrait vers une garnison d'occupation pendant la fenêtre de capture (cohérent avec 14-pvp-conquest.md).

**Doc mise à jour** :
- `docs/gameplay/04-combat.md` : nouvelle section § Renforts entre ses propres villages (tableau complet des règles, statut MVP, références croisées).

**Implémentation** : pas encore codée. Hors scope de ce ticket — à créer comme feature ticket dédié quand la priorité MVP sera donnée.

## Symptôme

`docs/gameplay/04-combat.md:20` — « armée stationnée applique sa puissance défensive » : pas explicite si on peut stationner une armée du village A dans le village B.

`docs/gameplay/14-pvp-conquest.md:99-101` — interdit les renforts vers une garnison de capture, mais ne traite pas le cas général (renforts entre villages hors fenêtre conquête).

`docs/gameplay/12-village-styles.md:104` — annonce stratégies multi-village (capitale Forteresse + outposts Raiders) qui supposent du transit de troupes.

## Question à trancher

Au MVP, transfert de troupes entre mes villages : autorisé / interdit / autorisé sous conditions ? Si autorisé : est-ce un trajet combat-like (durée, rappel possible) ou instantané ? Le bonus de style suit la troupe (déjà tranché — cf. 12-village-styles.md § À qui s'appliquent les bonus) — confirme la cohérence.
