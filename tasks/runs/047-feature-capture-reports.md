# Run #047 — feature-capture-reports

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 7 — Conquête PvP
- **Spec source** : [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md), [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md)
- **Type** : feature
- **Modules backend** : `combat`, `conquest`, `reports`, `event`
- **Modules frontend** : `pixi/features/combat`, `pixi/api`, inbox/messages

## Dépendances

- Conquête PvP et fenêtre `PendingConquest` déjà livrées.
- Inbox combat persistante déjà livrée par [`012-feature-inbox-combat-reports`](./archive/012-feature-inbox-combat-reports.md).
- Rapport défenseur d'occupation partiel déjà traité par [`tasks/archive/53-capture-occupation-defense-report-missing.md`](../archive/53-capture-occupation-defense-report-missing.md).
- Modal victoire conquête déjà livré par [`024-feature-conquest-victory-modal`](./archive/024-feature-conquest-victory-modal.md), mais ne remplace pas un rapport inbox persistant.

## Critère de fin (acceptance)

- [ ] Les specs `14-pvp-conquest.md` et `17-inbox-and-reports.md` décrivent la matrice complète des rapports de capture, y compris l'exception village barbare.
- [ ] Une attaque initiale avec Seigneur produit toujours un rapport de combat normal, victoire ou défaite.
- [ ] Chaque attaque reçue pendant une capture PvP crée les rapports attendus pour l'attaquant tiers, l'attaquant initial occupant et le propriétaire original selon le contrat spec.
- [ ] Si le village en capture est barbare, aucun rapport n'est créé pour un défenseur propriétaire inexistant.
- [ ] Plusieurs attaques successives pendant la même fenêtre produisent chacune leurs rapports sans écraser les précédents.
- [ ] La fin de capture PvP crée un rapport final pour le conquérant et pour le joueur qui perd le village.
- [ ] Un joueur non destinataire ne peut pas lire, marquer lu, ni masquer un rapport capture.
- [ ] Les états lu/masqué restent isolés par destinataire.
- [ ] Les events existants `battle.resolved`, `village.attacked`, `village.conquered` et `village.capture-window-*` continuent à rafraîchir inbox, carte et activités de capture.
- [ ] L'inbox distingue visuellement attaque, défense de capture, capture réussie et capture perdue sans exposer d'UUID brut.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] Specs matrice rapports capture — `rtk grep "capture contestée\\|défense de capture\\|rapport final" docs/gameplay/14-pvp-conquest.md docs/gameplay/17-inbox-and-reports.md` → à vérifier.
  - [ ] Attaque initiale avec Seigneur = rapport combat normal — test/smoke backend à préciser pendant le run.
  - [ ] Attaque pendant capture PvP = rapports attendus pour les destinataires concernés — test/smoke backend à préciser pendant le run.
  - [ ] Exception barbare sans rapport propriétaire — test/smoke backend à préciser pendant le run.
  - [ ] Attaques successives sans écrasement — test/smoke backend à préciser pendant le run.
  - [ ] Rapport final conquérant + joueur perdant — test/smoke backend à préciser pendant le run.
  - [ ] Accès interdit aux non-destinataires — curl/test REST à préciser pendant le run.
  - [ ] États lu/masqué isolés par destinataire — test REST à préciser pendant le run.
  - [ ] Events existants continuent à rafraîchir les surfaces concernées — test frontend/ws ou smoke à préciser pendant le run.
  - [ ] Labels inbox lisibles — visuel/gameplay.
- **Review indépendante** : `Déclenchée (raison: back+front, invariant gameplay durable, specs modifiées, diff estimé > 100 lignes)` avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : commandes exactes + résultat synthétique à remplir pendant le run.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : REST/worker/job/SQL à remplir pendant le run selon le modèle retenu.
- **Tests IG à faire par le user** : vérifier dans l'inbox la lisibilité des labels attaque, défense de capture, capture réussie et capture perdue sur un scénario réel si l'agent ne peut pas le prouver par tests automatisés.

## Contexte cartographié

Le modèle actuel `CombatReport` est centré sur deux rôles persistants : `attackerUserId` et `defenderUserId`, avec `readByAttacker/readByDefender` et `hiddenByAttacker/hiddenByDefender`. `combat-report.presenter.ts` contient déjà une exception `occupationDefense` qui présente à l'occupant initial un combat subi pendant une capture comme un rapport de défense.

Cette base ne couvre pas encore tout le besoin :

- le propriétaire original d'un village joueur en cours de capture n'a pas de rôle inbox explicite quand un tiers attaque la capture ;
- le rapport final de capture/perte n'est pas une archive métier persistante, `village.conquered` étant seulement un event temps réel ;
- les villages barbares ne doivent pas générer de rapport pour un propriétaire inexistant ;
- la terminologie du propriétaire original pendant une attaque de fenêtre doit être tranchée dans la spec avant codage.

## Pistes de design

### Piste A — Projection capture sur `CombatReport`

Garder le rapport d'attaque normal pour l'attaquant tiers, projeter l'attaquant initial en `Défense de capture`, et ajouter dans `details` une variante pour le propriétaire original du village joueur, par exemple `Capture contestée` / `Village sous capture attaqué`.

Avantage : peu de tables nouvelles, continuité avec `occupationDefense`.

Risque : le modèle binaire `attackerUserId` / `defenderUserId` devient de plus en plus spécial-casé, surtout pour trois destinataires et les rapports finaux.

### Piste B — Rapport métier capture dédié

Créer un vrai rapport de capture, par exemple `CaptureReport` + entrées inbox par destinataire, pour les événements qui ne sont pas strictement un combat attaquant/défenseur : notification du propriétaire original pendant la fenêtre, capture réussie, village perdu.

Avantage : modèle propre pour les rapports multi-destinataires et les rapports finaux.

Risque : plus de migration/API/frontend, donc à cadrer strictement pour ne pas refondre toute l'inbox.

### Piste C — Extension JSON minimale

Étendre `CombatReport.details` avec des variantes `captureDefense`, `captureContested`, `captureFinal`, et adapter le presenter/frontend.

Avantage : rapide.

Risque : dette de modèle durable, access control plus fragile, et mauvaise séparation entre combat réel et événement final de capture.

## Recommandation initiale

Commencer le run par la spec et choisir la piste après cartographie détaillée du modèle inbox. Le libellé recommandé pour le propriétaire original pendant une attaque de fenêtre est **Capture contestée** : il ne défend pas directement le combat, mais il reçoit une information importante sur le village qu'il est en train de perdre.

Si le modèle `CombatReport` ne peut pas représenter proprement les trois vues sans ambiguïté d'accès, privilégier la piste B plutôt que d'empiler des rôles implicites dans `details`.

## Liens détectés

- **À faire avant** : trancher et écrire le contrat du propriétaire original pendant les attaques de fenêtre dans `14-pvp-conquest.md` et `17-inbox-and-reports.md`.
- **À faire après** : éventuels filtres/catégories inbox et deep-link push vers rapport capture quand les notifications seront branchées.
- **Doublon potentiel** : [`tasks/archive/53-capture-occupation-defense-report-missing.md`](../archive/53-capture-occupation-defense-report-missing.md) couvre seulement le rapport défenseur pour l'occupant initial.
- **Connexe** : [`tasks/runs/archive/012-feature-inbox-combat-reports.md`](./archive/012-feature-inbox-combat-reports.md), [`tasks/runs/archive/024-feature-conquest-victory-modal.md`](./archive/024-feature-conquest-victory-modal.md), [`tasks/archive/41-capture-window-data-model.md`](../archive/41-capture-window-data-model.md), [`tasks/archive/42-combat-conquest-hook.md`](../archive/42-combat-conquest-hook.md), [`tasks/archive/46-capture-window-tracker-missing.md`](../archive/46-capture-window-tracker-missing.md).
- **Déjà résolu** : `occupationDefense` partiel, `PendingConquest`, capture finalize, modal victoire conquête.
- **Keywords scannés** : `capture`, `conquest`, `report`, `combat`, `noble`, `village`.

## Points d'attention

- Ne pas casser le comportement `occupationDefense` existant : l'attaquant initial doit continuer à lire comme défenseur quand sa garnison de capture est attaquée.
- Vérifier le cas self-attack déjà mentionné dans le ticket 53.
- Ne pas créer de rapport propriétaire pour un village barbare.
- Ne pas utiliser `EventOutbox` comme archive métier persistante.
- Préserver l'isolation lu/masqué par destinataire, notamment si le rapport implique trois joueurs.
- La feature est large ; si le refinement dépasse un scope raisonnable, segmenter en deux runs : spec/backend modèle, puis frontend/UX inbox.
