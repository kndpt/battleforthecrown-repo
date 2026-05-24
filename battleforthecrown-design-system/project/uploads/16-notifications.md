# Notifications push & timers

> 🚧 **Doc en chantier.** Spec à détailler plus tard. Cette page existe pour acter que les notifications push entrent dans le scope **MVP** — l'analyse design (catalogue exact, opt-in granulaire, latence acceptable, intégration FCM/APNs) viendra dans une seconde passe.

## Pourquoi c'est obligatoire au MVP

Sur mobile, l'asymétrie temporelle écrase le défenseur sans notifications. Un joueur qui découvre 8 h après coup que son village est tombé pendant la nuit — sans avoir eu la fenêtre pour réagir — quitte le jeu. La plupart des combats et conquêtes se résolvent **pendant** que le joueur ne regarde pas l'app : c'est la notification qui ramène le joueur dans la boucle, pas l'app elle-même.

C'est aussi la condition pour que les fenêtres de capture variables (4 à 18 h, cf. [`14-pvp-conquest.md` § Période de capture variable](./14-pvp-conquest.md#période-de-capture-variable-selon-le-niveau-du-château)) aient un sens : sans notif, l'attaquant ne sait pas quand sa conquête a tenu, et le défenseur ne sait pas qu'il doit lever une armée.

Modèle de référence : Tribal Wars / Kingsage affichent le timer d'attaque entrante en permanence dans l'app et envoient un push si elle est fermée. C'est le comportement minimum attendu sur le segment.

## Cible MVP — esquisse

Catégories de notifications, chaînées au pattern Outbox côté backend (cf. [`docs/architecture/realtime.md`](../architecture/realtime.md)).

| Catégorie | Trigger | Audience | Criticité |
| --- | --- | --- | --- |
| **Attaque entrante** (avec ETA) | Une armée ennemie est en route vers un de mes villages | Défenseur | 🔴 Critique — fenêtre de réaction limitée |
| **Fin de fenêtre de capture** | La fenêtre de [conquête](./14-pvp-conquest.md#période-de-capture-variable-selon-le-niveau-du-château) que je tiens (ou qui me cible) se termine — succès ou échec | Attaquant + défenseur | 🔴 Critique — issue stratégique majeure |
| **Site d'exploitation attaqué** | Une équipe envoyée sur un site de ressource est attaquée | Exploitant | 🔴 Critique — perte possible d'escorte / récolte |
| **Retour d'armée** | Une armée revient avec troupes, loot ou fin de rappel | Propriétaire | 🟡 Important — relance une décision |
| **Rapport reçu** | Un rapport combat / scout important est créé | Participant | 🟡 Important — ouvre vers l'inbox si pertinent |
| **Fin de construction / entraînement** | Un upgrade de bâtiment ou une queue d'entraînement se termine | Propriétaire | 🟡 Rétention — incite à la session suivante |

Détails à trancher plus tard : opt-in/opt-out par catégorie, regroupement (un seul push pour 3 entraînements simultanés ?), latence acceptable, fallback in-app (badge HUD) si push refusé par l'OS, deep-link vers le bon écran, intégration FCM/APNs et plomberie côté backend.

## Asymétrie attaquant ↔ défenseur

Point d'attention design pour la spec finale : l'attaquant **choisit** son timing (il sait quand il a cliqué « envoyer »), le défenseur **subit** (il ne contrôle pas quand il est attaqué). Donc la notif d'attaque entrante est **structurellement plus critique** que la notif de retour d'armée pour l'attaquant. Latence et fiabilité doivent être dimensionnées sur ce cas-là.

## Liens

- [`14-pvp-conquest.md`](./14-pvp-conquest.md) — fenêtres de capture variables (consommateur principal des notifs).
- [`04-combat.md`](./04-combat.md) — mécanique de raid / retour d'armée (consommateur des notifs entrante + retour).
- [`docs/architecture/realtime.md`](../architecture/realtime.md) — pattern Outbox + WebSocket (canal in-app, à compléter par push pour les sessions fermées).
- [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md) — cartes quotidiennes et Oyez ; les notifications ne sont pas une quête, elles ramènent au bon moment.
- [`15-onboarding.md`](./15-onboarding.md) — l'autre boucle MVP de rétention session-1.
- [`lab/tickets/07-resource-extraction-sites.md`](./lab/tickets/07-resource-extraction-sites.md) — site d'exploitation attaqué (idée lab, non MVP).
