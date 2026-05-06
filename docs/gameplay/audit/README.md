# Audit gameplay — Tickets

Issus d'une analyse gameplay du projet au 2026-05-06 : documentation gameplay, constantes partagées, services backend et écrans Pixi/React ont été parcourus pour identifier les problèmes de design ou les écarts entre l'intention produit et le comportement actuellement observé.

Chaque ticket décrit **une problématique observée**, factuelle, avec références `path:line` quand le code ou la documentation permet de l'ancrer. Les tickets sont volontairement **sans solution** : un autre agent devra reprendre chaque sujet, confirmer le diagnostic, étudier les options et proposer un plan séparé.

## Légende

- 🔴 **Critique** — risque de casser une boucle centrale, l'équilibrage ou la rétention court terme.
- 🟡 **Majeure** — manque structurel qui limite la profondeur, la modernité mobile ou la progression.
- 🟠 **Moyenne** — incohérence, manque de lisibilité ou friction qui dégrade l'expérience.

## Tickets

### Boucles coeur

- [01 — Raids barbares sans risque réel](./01-barbarian-raids-no-risk.md) 🔴
- [02 — Combat PvP trop binaire](./02-pvp-combat-too-binary.md) 🔴
- [03 — Onboarding économique sans action immédiate garantie](./03-onboarding-economy-no-guaranteed-first-actions.md) 🔴
- [04 — Population incohérente entre design et code](./04-population-design-code-drift.md) 🔴

### Rétention mobile

- [05 — Rétention moderne surtout documentée](./05-retention-systems-mostly-documented.md) 🟡
- [06 — Progression saisonnière absente de la boucle active](./06-seasonal-progression-missing.md) 🟡
- [07 — Retour en session insuffisamment ritualisé](./07-session-return-not-ritualized.md) 🟡

### Carte, exploration, PvP

- [08 — Fog of war partiellement neutralisé côté frontend](./08-fog-of-war-frontend-filtering-risk.md) 🟡
- [09 — Cibles de carte peu informatives avant attaque](./09-map-targets-low-information.md) 🟠
- [10 — PvP exposé avant garde-fous de snowball visibles](./10-pvp-snowball-guardrails-unclear.md) 🟡

### Économie et progression

- [11 — Objectif 50/50 production-pillage non garanti par les systèmes actuels](./11-production-raiding-balance-unproven.md) 🟡
- [12 — Multi-village et conquête encore peu porteurs dans le code actif](./12-multivillage-conquest-loop-not-active.md) 🟡

## Process pour traiter un ticket

1. Lire le ticket en entier.
2. Vérifier les références citées dans le code et la documentation.
3. Confirmer si le problème existe toujours sur la branche courante.
4. Compléter le diagnostic avec données de jeu, captures, logs ou tests manuels si nécessaire.
5. Proposer ensuite seulement des solutions et arbitrages dans un document ou une tâche séparée.

## Notes

- Ces tickets sont des constats, pas des spécifications.
- Certains problèmes sont des écarts entre la vision gameplay et l'implémentation actuelle ; ils ne sont pas forcément des bugs techniques.
- Les références de ligne peuvent dériver avec les futures modifications. Le titre et le symptôme restent l'entrée principale.
