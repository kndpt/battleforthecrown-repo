# 077 — Cleanup village narrative onboarding post-victoire

**Sévérité** : 🟠 Moyen
**Statut** : ✅ Fait
**Spec amont** : [`docs/gameplay/15-onboarding.md`](../docs/gameplay/15-onboarding.md)

## Symptome

Apres victoire sur le village narrative onboarding (`ONBOARDING_NARRATIVE`), celui-ci persiste indefiniment sur la carte. Sur un serveur actif : 1 village fantome par joueur inscrit, case de grille occupee, milices en regeneration via `barbarian-runtime.service.ts`, contribution aux calculs de spacing.

## Cause racine probable

Le run 054 a implemente la creation du village narrative (`OnboardingNarrativeTargetService.ensureForVillage`) mais pas de cleanup post-victoire. La FK `OnboardingState.narrativeTargetVillageId` a `ON DELETE SET NULL` (deja gere cote `ensureForVillage` L96-99), donc la suppression du village est safe.

## Comportement attendu

- Apres completion de l'etape `ATTACK_BARBARIAN`, le village `ONBOARDING_NARRATIVE` reference par le joueur est supprime de la table `Village`.
- `OnboardingState.narrativeTargetVillageId` passe a `null` (via `ON DELETE SET NULL`).
- Les donnees liees (Building, ResourceStock, Population, UnitInventory) sont supprimees en cascade Prisma.
- La case de grille est liberee.
- Le frontend se resynchronise sans erreur.

## Piste

Point d'insertion : dans `reconcileStateFromFacts()` (`onboarding.service.ts` L216-223), apres le passage a `status=COMPLETED` + `completedAt`, ajouter `tx.village.delete({ where: { id: narrativeTargetVillageId } })` si non-null. Les cascades Prisma gerent les tables liees.

## Scope recommande

### Backend

- `onboarding.service.ts` — `reconcileStateFromFacts` : ajouter delete du village narrative apres completion
- Eventuellement `onboarding-narrative-target.service.ts` — methode `deleteTarget` si on veut centraliser

### Tests

- Test unitaire dans `onboarding.service.spec.ts` : village narrative supprime apres completion de `ATTACK_BARBARIAN`
- Smoke : verifier que le flow onboarding complet reste vert

### Docs

- Optionnel : note dans `15-onboarding.md` sur le lifecycle post-victoire

## Points d'attention

1. **Edge case expedition en vol** : si une 2e attaque cible le village narrative pendant que la 1ere victoire trigger le cleanup, verifier les FK sur Expedition (cascade ou restrict).
2. **Deux chemins d'appel** : `recordOutboxEvent` (event-driven) et `reconcileActiveStateFromFacts` (GET /summary lazy) — les deux doivent supporter le cleanup.
3. **Nettoyage retroactif** : les villages narratifs de joueurs ayant deja complete l'onboarding resteront en base. Prevoir un SQL one-shot : `DELETE FROM village WHERE origin_kind = 'ONBOARDING_NARRATIVE' AND id NOT IN (SELECT narrative_target_village_id FROM onboarding_state WHERE narrative_target_village_id IS NOT NULL AND status = 'ACTIVE')`.
4. **Event WS** : emettre un event `village.removed` (ou equivalent) si le world-map ecoute les suppressions de villages, sinon le fantome reste affiche jusqu'au prochain full-refresh.

## Criteres de succes

- [x] Village `ONBOARDING_NARRATIVE` supprime de la table `Village` apres completion `ATTACK_BARBARIAN` (smoke)
- [x] `narrativeTargetVillageId` null apres completion (smoke)
- [x] Donnees liees supprimees en cascade (smoke)
- [x] Case de grille liberee (smoke)
- [x] Aucune regression sur le flow onboarding complet (smoke existant)
- [ ] Frontend : village disparait de la carte (checklist QA IG)
