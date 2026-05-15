# Run #027 — world-tempo-recalibrate-mvp-constants

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — chantier pré-MVP (recalibration tempo, suite directe du Run 026, cf. [`docs/gameplay/23-world-tempo-and-multipliers.md § 7`](../../docs/gameplay/23-world-tempo-and-multipliers.md))
- **Spec source** : [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md) — § 1 (compression ~4-5×), § 3 (anatomie session 60 j), § 7 (checklist de repérage)
- **Type** : spec (édition docs gameplay) + feature (constantes shared)
- **Modules backend** : `—` (pas de modification de logique)
- **Modules frontend** : `—`

## Dépendances

- ✅ **Run [`026-world-tempo-plumbing-clean-cut`](./026-world-tempo-plumbing-clean-cut.md) DONE** — sans la plomberie `tempo`, les chiffres recalibrés tomberaient dans un schéma legacy. Bloquant strict.

## Critère de fin (acceptance)

- [ ] Cap « première conquête » jouable en J+5 à J+7 sur scénario scripté (cf. § 3 de la spec).
- [ ] Cible « ~1 mois pour maxer un village » descendue à 10-15 j (§ 7 de la spec).
- [ ] Toutes les colonnes "Temps (s)" de `03-buildings.md` recalibrées à `tempo.global = 1.0` du Standard MVP compressed.
- [ ] Régénération barbare (`06-barbarians.md` § Régénération) : cycle vide → plein compressé (~10-25 h selon tier, à valider en playtest scripté).
- [ ] Entraînement Seigneur (`10-conquest.md`) : 8 h → ~2 h.
- [ ] Fenêtres de capture barbare (`13-barbarian-conquest.md`) : courbe 2/4/6/9/12 h → ~30 min / 1 h / 1 h 30 / 2 h / 3 h (à valider).
- [ ] Fenêtres de capture PvP (`14-pvp-conquest.md`) : courbe 4/6/9/12/18 h → équivalent compressed (à valider).
- [ ] `15-onboarding.md` : cible "5 étapes en ≤ 10 min" reconfirmée (probablement encore plus courte).
- [ ] `02-economy-and-progression.md` : Phases de progression, cibles, validation économique (Semaine 1-4) et "3 jours de revenu pour 5 000 couronnes" recalibrés cohérents.
- [ ] `07-barbarian-spawning.md` : densité de spawn / catchup vérifiée vis-à-vis de la consommation joueur compressée.
- [ ] `DEFAULT_CROWNS.conversionRate` et toutes les constantes de durée dans `packages/shared/src/buildings/` et `packages/shared/src/units/` alignées avec les nouvelles valeurs des docs.
- [ ] Audit `rg` final : aucune durée legacy (heures décimales 6h/12h/etc. associées à du gameplay tempo) non recalibrée dans les docs concernées.
- [ ] Invariants wall-clock **NON modifiés** (§ 6.1) : bouclier débutant 48 h, cooldown style 24 h, reset cartes 04:00, abandon 14 j.
- [ ] `yarn static-check` vert ; tous les tests pure-logic et smokes consommant des constantes shared restent verts (ou sont mis à jour explicitement avec mention dans le rapport).

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

- **Critères d'acceptance vérifiés** :
  - [ ] <comportement attendu observable> — preuve : <test auto / smoke / curl / SELECT / capture>
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : tests bout-en-bout manuels exécutés par l'agent quand pertinent (`server + curl`, REST, WebSocket, worker/job, ou `SELECT` DB), avec résultat observable. Si non fait, `Non nécessaire` ou `Non exécuté` + raison précise.
- **Tests IG à faire par le user** : seulement ce qui demande une appréciation gameplay/visuelle, un vrai navigateur humain, ou un scénario trop coûteux à automatiser ; checklist observable. Sinon `Aucun test IG nécessaire`, raison.

## Points d'attention

- ⚠️ **Cohérence inter-docs** : si `Château 6` coûte 10 j de construction et le cap « première conquête » vise J+5, contradiction. À vérifier croisé entre `02`, `03` et le cap narratif.
- ⚠️ **Wall-clock intouchables** : bouclier débutant (48 h, [`14`](../../docs/gameplay/14-pvp-conquest.md)), cooldown style (24 h, [`12`](../../docs/gameplay/12-village-styles.md)), reset cartes 04:00 ([`05`](../../docs/gameplay/05-daily-cards-and-oyez.md)), abandon 14 j ([`18`](../../docs/gameplay/18-inactivity-and-abandonment.md)). **Ne PAS scaler** — c'est un piège récurrent. Cf. § 6.1 de la spec.
- ⚠️ **Vision Watchtower** : distance géométrique en cases, **pas un temps** → intouchable.
- ⚠️ **Mobilité unités** (`speed` par unité dans `08-units.md`) : intouchable. Le scaling se fait via `tempo.travelSpeed`, sans toucher aux ratios cavalier > infanterie > siège.
- ⚠️ **Valeurs cibles approximatives** : les valeurs proposées dans § 7 (« 30 min / 1 h / 1 h 30 / 2 h / 3 h ») sont des **hypothèses** de la spec, pas des valeurs définitives. Ce run doit poser des valeurs sourcées (compression ~4-5× du baseline existant) et les justifier dans `## Décisions prises`.
- ⚠️ **Constantes shared synchronisées** : un drift entre doc et code crée des bugs latents difficiles à débusquer. Faire le pass doc → code dans la même décomposition.
- ⚠️ **Pas de modification de logique** : ce run ne touche **aucune** formule ni `TempoService`. Si une formule semble buggée pendant la recalibration, ouvrir un ticket séparé.

## Liens

- Spec : [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md)
- Run précédent (bloquant) : [`026-world-tempo-plumbing-clean-cut`](./026-world-tempo-plumbing-clean-cut.md)
- Docs gameplay impactées (checklist § 7) : [`02`](../../docs/gameplay/02-economy-and-progression.md), [`03`](../../docs/gameplay/03-buildings.md), [`06`](../../docs/gameplay/06-barbarians.md), [`07`](../../docs/gameplay/07-barbarian-spawning.md), [`10`](../../docs/gameplay/10-conquest.md), [`13`](../../docs/gameplay/13-barbarian-conquest.md), [`14`](../../docs/gameplay/14-pvp-conquest.md), [`15`](../../docs/gameplay/15-onboarding.md)
