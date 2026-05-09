# 12 — Récompenses classements & cycles reset non chiffrés

**Sévérité** : 🟡 Majeure
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Constat** : aucun module backend de classement thématique n'existe (seul `power/leaderboard` mesure la puissance). Ticket 100 % design/doc.

**Décisions** :
- **Granularité** : Top 3 (Or / Argent / Bronze) pour chacun des 4 classements.
- **Cycle** : tous **hebdomadaire** (reset lundi 00:00 UTC). Pas de cycle mensuel au MVP — décision « simplicité d'abord », ré-évaluable en post-MVP via classement saisonnier.
- **Pillards** : 1 500 / 1 000 / 500 couronnes (calé sur 1 jour de revenu mid-game pour le Top 1, cohérent avec ticket 11).
- **Architectes** : +5 % / +3 % / +2 % production (bois/pierre/fer) pendant 7 j.
- **Boucliers** & **Chevaliers** : cosmétiques uniquement (bannières et couronnes prestige) — pas de bonus chiffré, les mécaniques de jeu récompensent déjà l'activité défensive et démographique.

**Doc mise à jour** :
- `docs/gameplay/09-power-and-rankings.md` § Classements : tableau complet avec critères, paliers, valeurs, calage économique, et règles de cycle.
- `docs/gameplay/02-economy-and-progression.md` § Couronnes / Gains : ligne « Classement Pillards » chiffrée avec lien vers le détail.

**Suite** : implémentation backend hors scope ce ticket — à créer comme un nouveau ticket `feature/rankings-weekly` quand la priorité sera donnée (post-MVP probable).

## Symptôme

`docs/gameplay/09-power-and-rankings.md:62-69` — 4 classements (Pillards/Boucliers/Architectes/Chevaliers), récompenses qualitatives (« Bonus couronnes », « Production +5 % temporaire », « Cosmétiques », « Prestige visuel »). Pas de montant, pas de durée du bonus, pas de critère top (top 1 ? top 10 ?).

`docs/gameplay/02-economy.md:81` — « Classement hebdo | +Z bonus » : Z indéfini.

`docs/gameplay/09-power-and-rankings.md:69` — « Réinitialisation hebdomadaire + mensuelle ». Pas clair quel classement reset hebdo, lequel mensuel, ou si c'est double cycle pour tous.

## Question à trancher

Pour chaque classement : seuils top-N, montant/durée du bonus, fréquence reset. Cohérent avec ticket 11 (taux couronnes baseline).
