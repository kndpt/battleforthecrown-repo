# 15 — `setTimeout` magiques dans `ws-bindings.ts` pour les transitions de phase d'expédition

**Statut** : ✅ Résolu le 2026-05-08
**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-pixi`
**Tags** : magic-numbers, timing, animations, ws

## Résolution

Résolu en deux temps :

**Phase 1 — commit `fcd84a5` (2026-05-08)** :
- Constantes nommées extraites dans `src/lib/expeditionTiming.ts` : `BATTLE_FLASH_DURATION_MS`, `RESOLVED_TO_RETURNING_DELAY_MS`, `RETURNED_TO_CLEANUP_DELAY_MS`. Le commentaire en tête documente le contrat (le delay doit excéder le flash).
- Source unique partagée par `ws-bindings.ts` (déclencheur du store) et `pixi/entities/ExpeditionVisual.ts` (FX).
- Tests fake-timer (`vi.useFakeTimers()`) sur la séquence `applyBattleResolved` et `applyBattleReturned`.

**Phase 2 (cette résolution)** :
- **Cleanup au démontage** : `ws-bindings.ts` track les timer IDs en vol dans un `Set<ReturnType<typeof setTimeout>>` module-level via un helper `scheduleTimeout`. La fonction de cleanup retournée par `bindServerEvents` les `clearTimeout` tous + reset le set, en plus de désabonner les sockets. Plus de mise à jour de store qui fire après le logout.

**Race conditions** (deux events `battle.resolved` rapides pour la même expedition) : non gérées explicitement. Cas pathologique mineur — le 2e timeout se contenterait de réécrire la même phase `RETURNING`. Si ça devenait un vrai problème en prod, tracker les timers par `expeditionId` dans une `Map`.

## Symptôme

Le frontend gère les transitions de phase d'une expédition (en route → résolu → retour → terminé) via des `setTimeout` à délais hardcodés (800 ms, 1200 ms, 600 ms). Ces valeurs ne sont ni nommées, ni documentées, ni configurables.

## Localisation

- `src/api/ws-bindings.ts:91-93` — transition `battle.resolved` → phase `RETURNING` après 800 ms.
- `src/api/ws-bindings.ts:108-113` — transition `battle.returned` → suppression de l'expedition après 600 ms.
- D'autres `setTimeout` similaires probablement (à confirmer en grep).

## Détail technique

Le pattern observé (extrait du rapport cross-workspace) :

```ts
// battle.resolved arrive du WS
useExpeditionsStore.update(payload.expeditionId, { phase: 'RESOLVED' });
setTimeout(() => {
  useExpeditionsStore.update(payload.expeditionId, { phase: 'RETURNING' });
}, 800); // ← magic
```

Pourquoi ces délais existent : créer une animation visuelle fluide. Le serveur émet l'event de résolution, le client laisse 800 ms à l'animation Pixi pour montrer "victoire/défaite" avant de passer à "armée en route de retour".

Pourquoi c'est fragile :
1. **Couplage caché** : la valeur 800 ms est liée à une animation côté Pixi (probablement dans `ExpeditionVisual` ou similaire). Changer l'animation sans changer le timeout = désync visuelle.
2. **Pas de configurabilité** : impossible de désactiver ou accélérer pour les tests.
3. **Pas de cleanup** : si le composant se démonte avant que le `setTimeout` se déclenche, le store est mis à jour quand même (memory leak léger, ou état incohérent).
4. **Race conditions** : si deux events `battle.resolved` arrivent rapidement pour la même expedition (cas pathologique mais possible), les `setTimeout` se cumulent.

## Impact

- **Animations fragiles** : refactor de l'animation Pixi sans connaître le contrat implicite avec ws-bindings → glitch visuel.
- **Test difficile** : un test d'intégration de la séquence d'attaque doit attendre ces 800/1200 ms en vrai. Lent et flaky.
- **Documentation manquante** : un nouveau dev qui voit `setTimeout(..., 800)` ne sait pas pourquoi cette valeur, ni où elle est aussi utilisée.

## Contexte

Pattern fréquent quand on couple animation et state machine : on tient à ce que le state ne bouge qu'après l'animation. Mais tant que c'est pas formalisé en state-machine + driver d'animation, ça reste de la magie.

## Pistes à explorer

- **Constantes nommées** : `PHASE_TRANSITION_DURATIONS = { resolvedToReturning: 800, returnedToCleanup: 600 } as const`. Documente l'intention.
- **Source unique** : si la durée est aussi utilisée par l'animation Pixi, exporter la constante depuis un module commun et l'importer des deux côtés.
- **State machine** : modéliser `ExpeditionPhase` en XState ou similaire avec des transitions temporisées. Plus verbeux mais explicite et testable.
- **Cleanup** : utiliser `AbortController` ou un ref `isMounted` pour annuler les timeouts au démontage.
- **Test** : utiliser `vi.useFakeTimers()` pour les tests d'intégration des transitions.

## Tickets liés

- [16 — Magic numbers hardcoded](./16-magic-numbers-hardcoded.md) — autre famille de constantes magiques.
- [11 — Optimistic UI asymétrique](./11-pixi-optimistic-ui-asymmetric.md) — autre exemple de pattern UI mal industrialisé.

## Dimensions à valider en sortie

- Toutes les durées sont nommées et documentées.
- La source de vérité de la durée est unique (pas de duplication entre ws-bindings et animations Pixi).
- Les `setTimeout` ont un mécanisme de cleanup au démontage.
- Tests qui couvrent au moins la séquence nominale d'attaque (sent → resolved → returning → returned → cleanup).
