# 16 — Magic numbers hardcodés sans constantes nommées (transverse)

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-backend`, `packages/shared`, `battleforthecrown-pixi`
**Tags** : magic-numbers, configurability, maintainability

## Symptôme

Plusieurs valeurs numériques significatives apparaissent dans le code sans constante nommée ni documentation. Elles fixent des seuils, des tailles de batch, des minimums — autant de paramètres qu'on voudrait pouvoir tuner ou comprendre.

## Localisation

### Backend
- `src/modules/resources/resources.service.ts:38` — `elapsedMs > 30000` (seuil de catch-up production ressources, 30 s).
- `src/modules/resources/resources.service.ts:88-90` — calcul `elapsedMinutes` avec coefficients implicites.
- `src/modules/crowns/crowns.service.ts:78` — `elapsedMs > 30000` (idem catch-up couronnes).
- `src/modules/world/barbarian-seeding.service.ts:75` — `maxSyncChunks = 4` (batch size de seeding sync).
- `src/modules/combat/combat.service.ts:155` — `100` (limite de `take` dans une requête).

### Shared
- `packages/shared/src/logic/building-cost.ts:63` — `Math.max(1000, Math.round(actualTimeSeconds * 1000))` (durée minimale de construction = 1 s).

### Frontend
- `src/api/ws-bindings.ts:91-93, 108-113` — délais d'animation (cf [ticket 15](./15-pixi-magic-timeouts-ws-bindings.md)).
- Probable d'autres valeurs (à grep `\b\d{3,5}\b` ou `\b[0-9]+_[0-9]+\b` pour numéros style `5_000`).

(Liste non exhaustive — un grep dédié donnera l'inventaire complet.)

## Détail technique

Chaque magic number a un coût unitaire faible mais cumulé :
1. **Compréhension** : `30000` ne dit pas "seuil de catch-up". Le lecteur doit deviner ou suivre git blame.
2. **Évolution** : si le seuil doit être ajusté (par exemple, 60 s pour réduire la charge DB), il faut grep et corriger à la main, en risquant d'oublier les jumeaux (resources + crowns).
3. **Configurabilité** : les seuils techniques sont parfois liés à des contraintes opérationnelles (taille DB, latence réseau). Hardcodés, ils sont pas tunables sans rebuild.
4. **Tests** : difficile d'écrire un test sur le comportement de catch-up si la valeur du seuil est cachée.

## Impact

- **Maintenance** : les changements de seuil sont risqués (oublier un jumeau, ne pas voir le couplage).
- **Lisibilité** : code parsemé de chiffres "magiques", baisse de la qualité perçue.
- **Configurabilité ops** : impossible de tuner sans déployer.
- **Effet cumulatif** : avec [ticket 15](./15-pixi-magic-timeouts-ws-bindings.md), on a une accumulation visible.

## Contexte

Tendance naturelle quand on prototype : taper directement la valeur. Le refacto systématique en constantes vient plus tard.

## Pistes à explorer

### Stratégie générale
- **Audit grep** : produire la liste exhaustive des magic numbers dans les 3 workspaces. Décider case par case.
- **Catégorisation** :
  - Constantes vraiment fixes → constantes nommées dans le module.
  - Constantes liées au gameplay → `packages/shared/<domain>/constants.ts`.
  - Constantes ops / infrastructure → variables d'environnement.

### Cas spécifiques
- **30s catch-up resources/crowns** : extraire en `RESOURCE_CATCHUP_THRESHOLD_MS = 30_000` (ou similaire) dans un fichier de constantes backend, ou en env var si on veut tuner en prod.
- **maxSyncChunks = 4** : nommer en `BARBARIAN_SEEDING_BATCH_SIZE`.
- **100 dans combat.service.ts:155** : nommer selon l'intention (pagination par défaut ? limite anti-DoS ?).
- **1000 ms minimum dans building-cost** : `MINIMUM_BUILD_TIME_MS = 1_000` dans le shared.

### Outillage
- **ESLint rule** `no-magic-numbers` (avec exceptions raisonnables 0, 1, -1, 100 pour pourcentages).
- **Tests** : si une valeur est critique, l'utiliser dans un test pour qu'un changement déclenche au moins un échec si la sémantique évolue.

## Tickets liés

- [15 — setTimeout magiques](./15-pixi-magic-timeouts-ws-bindings.md) — sous-cas concentré côté frontend.
- [06 — God services backend](./06-backend-god-services.md) — `WorldConfigService` est l'endroit où un certain nombre de "constantes" devraient peut-être plutôt vivre comme config monde.

## Dimensions à valider en sortie

- Inventaire complet (ou raisonnablement complet) des magic numbers dans les 3 workspaces.
- Décision case par case : nommé en constante ? exporté en env var ? fait partie de la config monde ?
- ESLint `no-magic-numbers` activée avec exceptions documentées.
