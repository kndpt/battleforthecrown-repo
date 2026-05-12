# 17 — Bénédictions : application temporelle non spécifiée

**Sévérité** : 🟠 Moyenne
**Statut** : ✅ Résolu 2026-05-09 — système entier reporté en post-MVP

## Résolution

**Décision (user)** : tout le système de **bénédictions quotidiennes** est **hors scope MVP**. Depuis le rework rétention, l'ancienne doc `05-events-and-retention.md` a été supprimée et remplacée par `05-daily-cards-and-oyez.md`; les bénédictions ne sont plus une spec vivante.

**Doc mise à jour** :
- Ancien état : `docs/gameplay/05-events-and-retention.md` § Bénédictions quotidiennes.
- État courant : supprimé de la source canonique ; les effets utiles éventuels devront être réintroduits via [`docs/gameplay/05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md) ou un nouveau ticket.

**Suite** : à reprendre quand le MVP sera stabilisé. Les 3 cas flous (combat lancé pendant bénédiction, construction démarrée avec bonus Maçon, slot Architecte à l'expiration) seront tranchés à ce moment-là avec une vision plus claire des contraintes runtime.

## Symptôme

Ancien symptôme : `docs/gameplay/05-events-and-retention.md:71-88` — bénédictions 4 h. Effets ponctuels (« +20 % butin sur barbares », « +1 slot construction ») ou continus (« Production globale +8 % ») mélangés sans règle d'application temporelle.

Cas flous :
- Combat lancé pendant la bénédiction Forgeron, résolu après timeout : bonus appliqué ?
- Construction démarrée avec bonus Maçon, finit après timeout : durée raccourcie reste ?
- Slot construction supplémentaire (Architecte) : à l'expiration, l'upgrade en cours sur le slot extra annulé / mis en pause / continue ?

Même question pour les Oyez (durée 24 h - 7 jours).

## Question à trancher

Règle uniforme par catégorie de bonus :
- **Snapshot au démarrage** (combat/upgrade lancé sous bénédiction → bonus garanti jusqu'à fin) ?
- **Continuous check** (bonus actif uniquement quand timer actif, perdu sinon) ?

Si le sujet revient, documenter dans une nouvelle spec dédiée ou dans `05-daily-cards-and-oyez.md` seulement si cela reste lié aux cartes.
