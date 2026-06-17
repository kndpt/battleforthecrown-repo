# 078 — Étape finale onboarding (acquittement butin)

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Spec amont** : [`docs/gameplay/15-onboarding.md`](../docs/gameplay/15-onboarding.md)

## Symptôme

Après victoire sur la cible narrative (`ONBOARDING_NARRATIVE`), le backend passe `COMPLETED` et le FAB tutoriel disparaît sans message ni validation. Le preview butin (bois/pierre/fer) est affiché sur les étapes 5–6, mais rien ne clôt le parcours côté joueur.

## Cause racine probable

`getOnboardingGuidance()` retourne `null` dès `status === 'COMPLETED'` (`onboardingViewModel.ts`). Le run 036 a livré la progression server-authoritative et la guidance par étape, pas l'écran de clôture post-victoire.

## Comportement attendu

1. Victoire sur la cible narrative → backend `COMPLETED` (inchangé).
2. Le frontend affiche **une dernière modale** tutoriel (même composant `OnboardingFab`, loot preview déjà en place via `getOnboardingNarrativeLoot('T1')`).
3. CTA principal (ex. « Récupérer le butin ») → acquitte et ferme définitivement le tutoriel.
4. Le joueur suit ensuite le flux combat normal : retour des troupes + notif butin existante (hors scope — pas de nouveau pipeline loot).

## Pistes

Une seule piste évidente : état `completion` front-only, déclenché quand `GET /onboarding` retourne `COMPLETED` et que l'acquittement local n'a pas encore eu lieu (`userId × worldId`).

## Scope recommandé

### Frontend

- `onboardingViewModel.ts` — exposer une guidance « completion » (titre, loot preview, CTA acquittement) au lieu de `null` sur `COMPLETED` non acquitté
- `OnboardingGuidance.tsx` — CTA final = dismiss (pas de navigation carte/armée)
- Persistance acquittement : `sessionStorage` ou store session, clé `userId × worldId` (one-shot, pas de re-trigger au refresh/rejoin)

### Tests

- `onboardingViewModel.test.ts` — guidance completion sur `COMPLETED`, `null` après acquittement
- `OnboardingFab.test.tsx` ou test `OnboardingGuidance` — rendu loot preview + CTA

### Docs

- Note courte dans `15-onboarding.md` : écran de clôture post-victoire (optionnel, si wording validé en run)

## Hors scope

- Crédit butin backend (pipeline combat/return inchangé)
- Toast ou event `battle.returned` dédié
- Event backend `onboarding.completed`
- Récompense bonus séparée de fin de tuto (hors MVP spec L35)

## Points d'attention

1. **Timing** : `COMPLETED` arrive à `battle.resolved` ; l'armée peut encore être en retour — la modale de clôture ne doit pas bloquer ni dupliquer la notif butin au retour.
2. **Comptes déjà `COMPLETED`** : ne pas afficher la modale au rejoin si déjà acquitté (flag local) ; comptes complétés avant ce ticket = pas de modale rétroactive sauf si flag absent et user jamais acquitté (accepter : première connexion post-deploy uniquement pour les nouveaux completes).
3. **Ticket 077** : suppression village narrative post-completion — ne pas régresser.
4. **Loot preview** : réutiliser `getOnboardingNarrativeLoot` / constante partagée avec les étapes 5–6 (pas de montants en dur).

## Critères de succès

- [ ] Après victoire narrative, modale finale avec preview butin (bois/pierre/fer)
- [ ] CTA valide → modale ne réapparaît plus (même session ni rejoin)
- [ ] Parcours étapes 1–6 inchangé avant victoire
- [ ] Tests viewModel + composant verts
- [ ] Checklist QA IG : victoire → modale clôture → valider → tutoriel absent, butin reçu au retour des troupes
