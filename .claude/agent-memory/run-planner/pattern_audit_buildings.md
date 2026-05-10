---
name: Pattern audit-buildings (spec 03)
description: Squelette récurrent pour un audit de catalogue (bâtiments, unités). Confrontation 1 ligne par item, lots économique/militaire/spécial, fix shared + tickets.
type: project
---

Pattern observé pour un audit de catalogue (bâtiments / unités). Réutilisable pour `audit-units` (spec 08) avec adaptation.

**Cible type** : un fichier `packages/shared/src/<domaine>/<entity>.ts` qui définit le catalogue (TYPES, DEFINITIONS, POWER_WEIGHTS, UNLOCK_REQUIREMENTS).

**Structure de tableau** : 1 ligne par entité du catalogue spec. Colonnes : `Entité | Présent code | Coûts/Stats OK | Unlock OK | Effet/Bonus OK | Statut MVP OK | Sévérité`.

**Lots de tâches** typiques :
- T1-T2 : extraction invariants spec + cartographie code (≤ 8 fichiers).
- T3 : tableau de confrontation exhaustif.
- T4 : lot **économique** (production, stockage, population).
- T5 : lot **militaire/exploration** (caserne, vision, mur).
- T6 : lot **spéciaux 1-niveau ou nouveaux** — souvent ce qu'apporte le ticket pré-existant (ici ticket 30 Council Hall + Throne Hall).
- T7 : mécanique transversale (file de construction, annulation).
- T8 : tests pure-logic.
- T9 : run + rapport.

**Why** : segmenter par lot évite que la décomposition explose à 15+ tâches sur un audit-catalogue.
**How to apply** : pour run 003 (units) et tout futur audit `tasks/runs/*-audit-<catalogue>.md`, démarrer avec ce squelette et l'adapter au domaine.

**Pièges récurrents** :
- Power weights manquants masqués par `DEFAULT_*_WEIGHT` fallback → une entité absente côté code passe à 5 (bâtiments) ou 1 (unités) sans alerte.
- Polymorphisme `type: string` côté Prisma : ajouter une nouvelle entité ne nécessite pas de migration DB. À confirmer en début de run.
- Frontend explicitement hors scope d'un audit catalogue backend ; toute UI consommatrice → ticket de suivi.
- Bâtiments désactivés MVP (`enabled: false`) doivent être codés (catalogue source de vérité) mais bloqués côté guard.
