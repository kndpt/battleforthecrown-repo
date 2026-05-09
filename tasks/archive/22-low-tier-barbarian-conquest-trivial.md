# 22 — Conquête T1/T2 quasi gratuite mais non assumée

**Sévérité** : 🟢 Mineure (design)
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Constat** : le symptôme du ticket part d'une mauvaise lecture du design. La doc dit déjà *« le village EST le cadeau, le contenu est minime »* et *« le joueur reçoit un emplacement + un socle »*. Donc le ratio Seigneur/contenu n'est pas le bon arbitrage — c'est le ratio Seigneur/**emplacement** qui compte.

**Décision (user)** : assumer que **petit ou grand barbare = un village en plus**. Tout emplacement vaut son Seigneur, indépendamment du tier. Argumentaire renforcé par le fait que les **barbares se raréfient progressivement** (consommation joueur > recyclage) — chaque barbare disponible devient de plus en plus précieux.

**Doc mise à jour** :
- `docs/gameplay/13-barbarian-conquest.md` § Conséquences concrètes : enrichissement de la *« Lecture design »* avec un encart explicite *« Petit ou grand barbare = un village en plus »* + référence à la raréfaction (06-barbarians.md).

**Choix écartés** :
- Restreindre la conquête T1/T2 (brime la liberté stratégique).
- Note alarmiste *« mauvais ratio »* (contredit l'intention design).

## Symptôme

`docs/gameplay/13-barbarian-conquest.md` — T1 = 2 h capture, bâtiments lvl 1, ressources reset.

À Château 6 + Salle du Trône construite, un joueur peut conquérir un T2 trivialement (4 h capture, défense quasi-nulle). **Vrai filtre** = investissement Seigneur (cf. `10-conquest.md` § Coût), pas la difficulté militaire.

Question : la spec ne dit nulle part qu'un T1/T2 conquis est un **mauvais ratio coût/valeur**. Un nouveau joueur peut viser un T1 et gaspiller son Seigneur sur un village quasi-vide.

## Question à trancher

- Accepter (laisser le joueur apprendre par expérience).
- Ajouter une note explicite dans `13-barbarian-conquest.md` § Conséquences concrètes : « T1 conquis = quasi-vide, mauvais ratio Seigneur/valeur — viser T3+ pour rentabiliser ».
- Restreindre conquête T1/T2 ? (pas recommandé — bride le joueur).
