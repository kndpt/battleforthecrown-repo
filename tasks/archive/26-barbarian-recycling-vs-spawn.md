# 26 — Recyclage barbares vs spawn neuf

**Sévérité** : 🟡 Majeure
**Statut** : 🟡 Décision provisoire 2026-05-09 (analyse approfondie à reprendre en pré-launch)

## Résolution provisoire

**Décidé au MVP** : spawn UNIQUEMENT à la 1ère arrivée du joueur dans le monde. Pas de cron de régulation, pas de spawn à la conquête, pas de spawn à la migration de village.

**Justifications** :
- Cohérent avec la raréfaction progressive volontaire (cf. ticket 22 — *« Petit ou grand barbare = un village en plus »*).
- Anti-exploit : empêche un joueur de multiplier ses villages pour multiplier le pool barbare farmable (préoccupation soulevée par le user).
- MVP minimal : zéro orchestration récurrente.

**À approfondir** (user) : un cron centralisé pourrait avoir un algo plus maîtrisé (régulation explicite des densités), mais ouvre des questions plus larges sur l'équilibre du gameplay (PvP émergent, valeur des emplacements, intention narrative). Décision finale **reportée en pré-launch** après observation playtest.

**Doc mise à jour** :
- `docs/gameplay/07-barbarian-spawning.md` § Anti-submersion : nouvelle sous-section *« Stratégie de spawn — décision provisoire »* qui acte les règles MVP (spawn à l'arrivée uniquement) avec encart d'incertitude pour la suite.

**Suite** : à reprendre quand le gameplay global sera plus mature. Considérations à creuser : exploit migration, équilibre densité long terme, articulation avec PvP émergent, signal narratif de la raréfaction.

## Symptôme

`docs/gameplay/07-barbarian-spawning.md:46` — non décidé : recycler les villages morts d'autres zones ou en créer de nouveaux à l'arrivée d'un joueur ?

Décision structurante : change radicalement la densité de carte sur monde âgé.
- **Spawn neuf systématique** → la carte se remplit au fil des arrivées, peut saturer.
- **Recyclage** → la carte garde une densité stable, mais les zones « pacifiées » par d'autres joueurs perdent leur progrès quand un nouveau spawn redonne vie à un village mort.

## Question à trancher

Stratégie de spawn :
- Spawn neuf jusqu'à seuil de densité, puis recyclage uniquement.
- Recyclage prioritaire (économie de ressources, monde stable).
- Hybride paramétré par `WorldConfig`.

À spécifier dans `07-barbarian-spawning.md` avant implémentation algo.
