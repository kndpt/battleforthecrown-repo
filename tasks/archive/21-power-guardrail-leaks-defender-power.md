# 21 — Garde-fou puissance ÷ 3 fuite la puissance défensive

**Sévérité** : 🟢 Mineure
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Décision** : accepter la fuite, la documenter explicitement comme tradeoff assumé. Le scout ESPION reste indispensable pour la compo précise — la fuite ne révèle qu'une **borne** de la puissance armée, pas la composition exacte qui pèse réellement au combat.

**Choix écartés** :
- Check sur puissance bâtiments uniquement → perte de fidélité (un piège « gros bâtiments + petite armée » paraîtrait attaquable, déséquilibrant la mécanique anti-snowball).
- Cacher le motif UX → frustre le joueur honnête, n'élimine pas la fuite côté API.

**Doc mise à jour** :
- `docs/gameplay/14-pvp-conquest.md` § Garde-fou par puissance : ajout d'un encart *« Tradeoff assumé — fuite de la puissance défensive par escalade »* qui acte la décision et explique la raison.

## Symptôme

`docs/gameplay/14-pvp-conquest.md:155` — UX : bouton attaque grisé + message « Puissance trop faible — protection serveur ».

`docs/gameplay/09-power-and-rankings.md:28` — la puissance armée est censée être **cachée** (révélée par scout ESPION).

Un attaquant peut sonder plusieurs cibles en escalade (puissance × 1, × 2, × 3...) pour borner la puissance défensive sans scout.

## Question à trancher

- Accepter la fuite (mineure, le scout reste utile pour la **compo précise**, pas juste l'estimation grossière).
- Masquer le motif (« attaque interdite » sans préciser pourquoi) — moins fair UX-wise.
- Server-side : refuser sans révéler le motif, mais mauvais signal joueur.

Probable acceptation. À documenter explicitement comme tradeoff assumé.
