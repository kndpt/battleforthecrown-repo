# 23 — Snowball PvP : ni cooldown re-conquête, ni bouclier post-perte

**Sévérité** : 🟡 Majeure
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Décision (user)** : pas de cooldown re-conquête, pas de bouclier post-perte. Modèle directement aligné sur Kingsage / Tribal Wars, validé par plusieurs décennies de PvP MMORTS. **Pas une hypothèse à playtester** — c'est une décision stable.

**Justification design** :
- Garde-fou puissance ÷ 3 (§ 14-pvp-conquest.md § 2) couvre la protection des petits joueurs de manière continue et fine.
- Dégarnissage du village d'origine + méta vautour créent une régulation naturelle suffisante.
- Le hot-fix reste possible si un cas extrême apparaît, mais ce n'est pas l'hypothèse.

**Doc mise à jour** :
- `docs/gameplay/14-pvp-conquest.md` § Cooldown de re-conquête : remplacement de *« À ré-examiner post-MVP… »* par référence Kingsage explicite et confirmation que la combinaison de garde-fous suffit.
- `docs/gameplay/14-pvp-conquest.md` § Bouclier post-perte : remplacement de *« À ré-examiner post-MVP »* par confirmation alignement Kingsage. Décision stable.

## Symptôme

`docs/gameplay/14-pvp-conquest.md:161-167` — pas de cooldown sur la re-conquête d'un village fraîchement conquis. Assume que la régulation naturelle (escorte affaiblie, puissance ÷ 3) suffit.

`docs/gameplay/14-pvp-conquest.md:178-186` — bouclier post-perte explicitement non retenu.

`docs/gameplay/10-conquest.md:84` — pas de limite de villages par joueur.

Combinaison : un top-player avec 3-4 Seigneurs en pipeline peut chaîner les conquêtes, transformer un voisin en source de villages.

## Question à trancher

- Garder MVP minimal (statu quo) et mesurer en playtest.
- Ajouter cooldown léger (X h) sur le village juste conquis = il ne peut pas être re-conquis pendant ce délai.
- Ajouter cap dynamique par puissance (déjà présent) suffisant ?

Réponse à confronter au playtest. Décision = trancher au moment de l'observation, pas en avance.
