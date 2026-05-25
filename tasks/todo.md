# Son d'entrée et commentaires PR

- [x] Vérifier les points d'intégration du loader, des assets audio et des events WS.
- [x] Ranger le son d'entrée avec un nom durable dans un dossier audio adapté.
- [x] Jouer le son à la fin du chargement d'entrée dans le monde.
- [x] Ranger et jouer le son de notification pour les toasts.
- [x] Corriger les invalidations world-scoped signalées par la review.
- [x] Adapter les tests ciblés.
- [x] Vérifier static-check/tests ciblés et impact docs.

## Review

- Son déplacé dans `public/assets/sounds/world-entry-complete.mp3`.
- Son de notification déplacé dans `public/assets/sounds/notification-received.mp3` et joué une fois par nouveau toast.
- Le son d'entrée est déclenché à la fin des 2 secondes du loader `/game`; les refus autoplay navigateur sont ignorés sans casser l'écran.
- Les invalidations WS des rapports et de la power royaume couvrent maintenant toutes les caches du joueur, pas seulement le monde affiché.
- Tests ciblés et static-check verts.
- Docs : aucun changement nécessaire.
