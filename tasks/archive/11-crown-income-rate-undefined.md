# 11 — Revenu en couronnes : taux par puissance non chiffré

**Sévérité** : 🟡 Majeure
**Workspace(s)** : design / `packages/shared`, `battleforthecrown-backend`
**Tags** : économie, équilibrage, gameplay-hole
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Constat** : le ticket est inexact. La formule existe déjà dans le code (`packages/shared/src/crowns/index.ts:7` → `DEFAULT_CROWNS.conversionRate = 0.05` ; appliquée dans `crowns.service.ts:46` `calculateProductionRate`). Trou de **doc + calibrage**, pas de code.

**Décision** :
- Modèle linéaire confirmé : `couronnes/h = puissance_bâtiments_cumulée × 0.05`.
- Calage : un Seigneur (5 000 couronnes) ≈ **3 jours** pour un joueur Château 6 mid-game (~1 400 puissance bâtiments → ~70 cour/h → 71 h). Cible « 2-3 jours » (équilibré) atteinte par le `k = 0.05` actuel.
- Aucun changement de code (le `k` actuel produit le calage cible).

**Docs mises à jour** :
- `docs/gameplay/02-economy-and-progression.md` § Couronnes : formule explicite + tableau de gains par phase (early/mid/late, 1 vs 3 villages).
- `docs/gameplay/09-power-and-rankings.md` § Système de puissance : ajout de la formule au lieu du wording vague *« proportionnel »*.
- `docs/gameplay/10-conquest.md` § Coût de recrutement : *« ~2-4 jours »* non sourcé → *« ~3 jours mid-game, ~1-2 jours late-game multi-villages »* avec lien vers le tableau.

**Suite** : les sources alternatives (raids, classements) restent à chiffrer côté ticket 12.

## Contexte

Les couronnes sont la **monnaie stratégique principale** : elles paient le Seigneur (5 000), les changements de style (60–305 selon Château), les bénédictions (150), un déplacement de village (200). Le coût Seigneur seul est l'investissement le plus structurant du end-game.

Côté **gain**, la doc gameplay décrit un revenu *« proportionnel à la puissance bâtiments cumulée du joueur »* — mais ne donne **aucun chiffre**. Le joueur ne peut pas répondre à *« en combien de temps puis-je m'offrir un Seigneur ? »*, et le designer ne peut pas équilibrer les coûts existants par rapport au revenu.

Sources qui annoncent la mécanique sans la chiffrer :

- [`docs/gameplay/02-economy-and-progression.md` § Couronnes](../docs/gameplay/02-economy-and-progression.md#couronnes) — *« +X / h (proportionnel à la puissance bâtiments) »* — `X` non défini.
- [`docs/gameplay/09-power-and-rankings.md` § Système de puissance](../docs/gameplay/09-power-and-rankings.md#système-de-puissance) — *« le revenu en couronnes : proportionnel à la puissance bâtiments cumulée »* — pas de coefficient.
- [`docs/gameplay/10-conquest.md`](../docs/gameplay/10-conquest.md) — Seigneur 5 000 couronnes, *« ~2-4 jours de production »* — estimation non sourcée.

## État actuel

- Aucune formule documentée : ni linéaire (`couronnes/h = puissance × k`), ni par paliers, ni avec floor/cap.
- Aucun chiffre de référence dans `packages/shared/` côté code (à confirmer — la doc évoque un endpoint `GET /power/village/:id` mais pas de constante de taux).
- Les autres dépenses en couronnes (style, bénédiction, déplacement) sont chiffrées en absolu sans contre-partie en revenu — déséquilibre de spec.

Conséquences concrètes :

- **Game design** : impossible de calibrer si le coût Seigneur (5 000) représente 1 jour, 3 jours, ou 1 semaine de revenu pour un joueur mid-game. La courbe d'accès au end-game est en l'air.
- **Comm joueur** : un panneau "+X couronnes/h" doit afficher une valeur — aujourd'hui rien à brancher.
- **Équilibrage classements** : *« Pillards de la semaine | Bonus couronnes »* (`09-power-and-rankings.md`) — sans taux de baseline, le bonus n'a pas d'échelle de référence.
- **Ratio production / pillage** : la spec économique vise 50/50 production/pillage en ressources (`02-economy.md` § Économie équilibrée). Le revenu couronnes n'est dans aucun des deux plateaux et personne ne sait si c'est un revenu d'appoint ou structurant.

## Pistes

### A. Taux linéaire simple

- `couronnes/h = puissance_bâtiments × k`, avec `k` à calibrer (ex : `k = 0.05` → un village max ~6500 puissance bâtiments rapporte ~325/h, soit 5000 en ~15 h).
- Avantage : trivial à implémenter (production tick existant), prédictible, lisible joueur.
- Coût : choisir `k` qui rend le Seigneur ni trivial ni inatteignable selon la phase (early/mid/late game).
- Question : est-ce qu'un Seigneur en 15 h pour un village max est cohérent avec *« vraie décision stratégique »* (`10-conquest.md`) ? Probablement trop rapide. À ajuster.

### B. Taux par paliers (Château)

- `couronnes/h` indexé sur le niveau du Château uniquement (pas sur la puissance globale). Ex : Château 1 = 5/h, Château 5 = 50/h, Château 10 = 200/h.
- Avantage : très lisible, calage sur la phase du joueur.
- Coût : décorrèle gain et investissement (un joueur qui maxe ses mines mais pas son Château gagne pareil). Peut casser la promesse *« puissance bâtiments »*.

### C. Taux mixte production + raid

- Couronnes = X/h passif (lié à puissance) + Y par raid barbare réussi + Z par victoire défensive. Cohérent avec la philosophie 50/50 production/pillage.
- Avantage : rend le Seigneur accessible plus vite à un joueur actif, plus lent à un passif. Récompense la boucle militaire.
- Coût : 3 leviers à équilibrer simultanément. Plus dur à playtest.

### D. Statu quo + mesure runtime

- Ne rien décider, observer en alpha quel rythme émerge des constantes existantes.
- Risque : le Seigneur reste un objectif flou. Le playtest ne mesure rien si le revenu n'existe pas dans le code.

## Question à trancher

Quel modèle de revenu en couronnes (A linéaire / B paliers / C mixte / D statu quo) ? Et avec quel objectif de calage : un Seigneur représente combien de jours de revenu pour un joueur mid-game (Château 6) qui *vient* de finir sa Salle du Trône ?

## Dimensions à valider en sortie

- `docs/gameplay/02-economy-and-progression.md` § Couronnes : tableau de gains chiffré (par phase ou par niveau Château).
- `docs/gameplay/09-power-and-rankings.md` § Système de puissance : formule explicite reliant puissance bâtiments → couronnes/h.
- `packages/shared/src/crowns/` : constante / formule pure de calcul, accessible front + back.
- Cohérence avec les coûts existants en couronnes (Seigneur 5 000, bénédictions 150, style 60–305, déplacement 200) — vérifier qu'aucun coût n'est trivial ni inatteignable selon la phase de jeu.
- Récompenses des classements (`09-power-and-rankings.md` § Classements) calibrées par rapport au baseline (ex : "+1 jour de revenu" comme cible).

## Tickets liés

- Audit gameplay racine identifie ce trou parmi d'autres (cf. analyse 2026-05-09 dans la conversation d'origine).
- [`docs/gameplay/audit/11-production-raiding-balance-unproven.md`](../docs/gameplay/audit/11-production-raiding-balance-unproven.md) — équilibre 50/50 ressources, sujet adjacent.
