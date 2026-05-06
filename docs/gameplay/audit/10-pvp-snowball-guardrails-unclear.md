# 10 — PvP exposé avant garde-fous de snowball visibles

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend`, `battleforthecrown-pixi`, `docs/gameplay`
**Tags** : pvp, snowball, protection, fairness

## Symptôme

Les villages joueurs visibles peuvent être attaqués, mais les garde-fous de snowball décrits dans la vision ne sont pas clairement observables dans le flow actuel. Avec un combat binaire et une économie pillable, un joueur en avance peut potentiellement convertir son avance en domination sans suffisamment de friction systémique.

## Localisation

- `battleforthecrown-pixi/src/features/world/SelectedEntityPanel.tsx:30-32` — les villages joueurs non possédés peuvent afficher l'action d'attaque.
- `battleforthecrown-backend/src/modules/combat/combat.service.ts:29-137` — initiation d'attaque : validation ownership, cible, unités, trajet, expédition.
- `docs/gameplay/01-overview.md:131-139` — protection post-perte et anti-snowball nocturne décrits pour les raids/persistance.
- `docs/gameplay/04-combat-and-army.md:128-151` — styles stratégiques et défense comme éléments de différenciation.

## Détail

La documentation mentionne une protection post-perte et une volonté d'éviter la frustration irréversible. Le code inspecté montre le lancement d'attaques et la résolution de combat, mais pas de lecture évidente de protections débutant, boucliers, limites de cible, fenêtres de vulnérabilité, ou caps de loot liés à l'écart de puissance.

## Impact gameplay

- Les nouveaux joueurs peuvent devenir des cibles rentables trop tôt.
- Les joueurs actifs peuvent accélérer leur progression aux dépens des passifs sans contrepoids suffisant.
- Les pertes PvP peuvent être perçues comme injustes si elles arrivent pendant l'absence.
- Les joueurs dominants peuvent verrouiller une zone et réduire l'intérêt des autres.
- Le PvP peut être repoussé mentalement par les joueurs casuals si la menace est mal bornée.

## Questions ouvertes

- Existe-t-il une protection débutant ou un bouclier en DB non visible dans les fichiers inspectés ?
- Les attaques entre joueurs sont-elles censées être ouvertes dès que la carte est révélée ?
- Les règles de loot PvP tiennent-elles compte de l'écart de puissance ?
- Y a-t-il un système de vengeance, immunité temporaire ou limite d'attaques répétées ?

## Tickets liés

- [02 — Combat PvP trop binaire](./02-pvp-combat-too-binary.md)
- [09 — Cibles de carte peu informatives avant attaque](./09-map-targets-low-information.md)
- [12 — Multi-village et conquête encore peu porteurs dans le code actif](./12-multivillage-conquest-loop-not-active.md)
