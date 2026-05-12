# 45 — Watchtower niveau 10 : supprimer la vision globale

**Sévérité** : 🟡 Majeure  
**Statut** : À traiter  
**Décision gameplay** : la Tour de guet niveau 10 doit avoir un rayon fini de **50 cases**, pas une vision mondiale.

## Symptôme

La spec gameplay a été corrigée pour faire de la Watchtower un outil de contrôle territorial :

- lvl 1 = 5 cases ;
- +5 cases par niveau ;
- lvl 10 = 50 cases ;
- la vision large vient de l'union des tours de plusieurs villages.

Le runtime peut encore exposer l'ancien comportement `visibilityRadius: null` / vision globale.

## Pourquoi

Une vision infinie casse plusieurs intentions :

- diminue l'intérêt de conquérir des positions stratégiques ;
- rend les futurs points d'intérêt de ressources trop visibles ;
- réduit la valeur de la proximité, du scout et du placement ;
- transforme la Watchtower max en bouton de révélation globale.

## Pistes

### A — Alignement minimal

- `WATCHTOWER_VISION_LEVELS[10].visibilityRadius = 50`.
- Retirer / neutraliser le raccourci `radius === null`.
- Mettre à jour les textes UI qui affichent "infini" ou équivalent.
- Adapter les tests vision si besoin.

### B — Hardening modèle

- Remplacer le type `number | null` par `number` pour `visibilityRadius`.
- Supprimer le concept de disque illimité dans `VisionDisk`.

Plus propre, mais plus large. À faire si le blast radius reste faible.

## Critères de succès

- Une Watchtower niveau 10 ne révèle que les entités dans un rayon de 50 cases.
- Les entités hors rayon restent fogged / invisibles selon les règles actuelles.
- Aucun chemin backend ne traite `radius === null` comme vision globale.
- La carte Pixi affiche un rayon fini.
- Docs gameplay déjà alignées : `docs/gameplay/00-game-flow.md`, `01-overview.md`, `03-buildings.md`.
- ADR architecture à finaliser quand le runtime est corrigé : `docs/architecture/decisions.md` ne doit plus mentionner de legacy `radius === null`.
