# Run 010 — implementation-frontend-reinforcements

## Plan

- [x] Préflight : repo clean, fiche PLANNED, spec/rules relues.
- [x] Cartographier les modules frontend/shared/backend nécessaires aux renforts.
- [x] Implémenter la lecture backend minimale de garnison.
- [x] Brancher les contrats REST/WS frontend pour renforts et garnison.
- [x] Implémenter l'envoi `Renforcer`, la section `Garnison` et les actions rappel/renvoi.
- [x] Différencier visuellement les expéditions `REINFORCE` sur carte/liste.
- [x] Vérifier tests/static-check, review 5 axes et impact docs.
- [x] Archiver la fiche, mettre à jour `tasks/README.md` et commit.

## Review

- Correctness : finding majeur corrigé sur `reinforcement.returned` déterministe via `expeditionId`; acceptance renforts couverte.
- Readability : découpage conservé dans les features existantes, pas de renommage massif du modal.
- Architecture : server-authoritative respecté via endpoint garrison, payloads events dans shared.
- Security : endpoint garrison protégé par ownership du village sélectionné.
- Performance : requêtes garrison bornées par village, mini-carte dessine des lignes simples Canvas2D.
- Vérifications : tests complets + smokes verts ; static-check type-check vert, lint backend baseline préexistant rouge.
- Docs : mises à jour ciblées dans gameplay/backend-modules/realtime.
