# 75 — Transition d'entrée monde rejouée à chaque navigation jeu

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Spec amont** : Aucune

## Symptôme

`world-entry-complete.mp3` se déclenche à chaque changement de vue intra-jeu (`/game`, `/game/world`, `/game/army`, `/game/messages`). L'overlay d'entrée monde risque aussi de se réafficher sur ces navigations.

Le son et l'overlay doivent se déclencher uniquement lors d'une vraie entrée dans le monde depuis hors jeu, ou lors d'un chargement/rechargement direct d'une session jeu.

## Cause racine probable

`GameEntryTransition` rend l'overlay dès que la route courante est une route `/game/*`, et son effet audio dépend de `location.key`.

React Router génère une nouvelle `location.key` à chaque navigation client-side. Une navigation intra-jeu `/game` → `/game/world` → `/game/army` reprogramme donc le timeout puis rejoue `world-entry-complete.mp3`, alors qu'il ne s'agit pas d'une entrée monde.

## Comportement attendu

- Entrée depuis `/worlds` vers `/game` : overlay d'entrée monde visible et son joué une seule fois.
- Chargement/rechargement direct sur `/game/*` avec session restaurée : overlay et son joués une seule fois.
- Navigation intra-jeu entre `/game`, `/game/world`, `/game/army`, `/game/messages` : aucun overlay d'entrée monde et aucun son `world-entry-complete.mp3`.
- Le son de notification (`notification-received.mp3`) et `ToastStack` restent inchangés.

## Scope recommandé

### Frontend

- `battleforthecrown-pixi/src/features/worlds/GameEntryTransition.tsx` : distinguer une vraie entrée dans l'espace jeu d'une navigation déjà interne à `/game/*`. Ne pas baser le déclenchement sur `location.key` seul.
- `battleforthecrown-pixi/src/features/worlds/GameEntryTransition.test.tsx` : ajouter des scénarios de navigation intra-jeu et de chargement direct.

### Contexte à préserver

- `battleforthecrown-pixi/src/features/layout/AuthenticatedShell.tsx` monte `GameEntryTransition` au-dessus des routes protégées.
- `battleforthecrown-pixi/src/features/worlds/WorldSessionGate.tsx` restaure le contexte monde/village lors d'un chargement direct.
- `tasks/runs/043-refactor-game-shell-layout.md` est connexe mais ne doit pas bloquer ce correctif ciblé.

## Points d'attention

- Ne pas casser le cas reconnexion ou reload direct sur `/game/*`.
- Couvrir l'overlay en plus du son : le bug visible n'est pas seulement audio.
- Ne pas déplacer toute la logique dans le refacto shell #043 ; ce ticket doit rester borné au déclenchement de transition.

## Critères de succès

- [ ] Navigation `/worlds` → `/game` : overlay visible et `world-entry-complete.mp3` joué exactement une fois après la durée prévue.
- [ ] Navigation intra-jeu `/game` → `/game/world` : aucun overlay d'entrée monde et aucun son rejoué.
- [ ] Navigation intra-jeu `/game/world` → `/game/army` → `/game/messages` : `world-entry-complete.mp3` n'est jamais rejoué.
- [ ] Chargement initial direct sur `/game/*` : entrée monde déclenchée une seule fois, y compris si `WorldSessionGate` restaure le contexte.
- [ ] `notification-received.mp3` et `ToastStack` restent inchangés.
- [ ] QA navigateur : changer d'onglet jeu ne masque pas l'écran courant avec l'overlay d'entrée monde.
