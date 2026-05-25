# Entrée animée dans le monde

- [x] Vérifier l’état réel du worktree et les composants concernés.
- [x] Déplacer l’animation d’entrée côté arrivée `/game`.
- [x] Garantir un affichage minimum de 2 secondes, y compris au reload.
- [x] Garder le blason complet dans le rond de l’overlay.
- [x] Adapter les tests ciblés.
- [x] Vérifier tests, static-check et rendu browser.

## Review

- L’animation est montée à l’arrivée sur `/game`, donc elle se joue aussi au reload et après navigation depuis `/worlds`.
- Le loader dure 2 secondes via CSS, sans timer React susceptible de rester bloqué.
- Le fond est opaque : le village ne transparaît plus pendant le chargement.
- Le halo, le rond et le blason sont centrés ensemble.
- Tests ciblés, static-check et vérification browser verts.
