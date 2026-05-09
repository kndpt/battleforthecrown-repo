# 17 — Bénédictions : application temporelle non spécifiée

**Sévérité** : 🟠 Moyenne
**Statut** : ✅ Résolu 2026-05-09 — système entier reporté en post-MVP

## Résolution

**Décision (user)** : tout le système de **bénédictions quotidiennes** est **hors scope MVP**. La spec reste en place comme intention, mais l'implémentation et la règle d'application temporelle (snapshot vs continuous check) seront tranchées au moment de la mise en chantier réelle, post-MVP.

**Doc mise à jour** :
- `docs/gameplay/05-events-and-retention.md` § Bénédictions quotidiennes : encart explicite *« Hors scope MVP »* en tête de section, avec lien vers ce ticket pour la traçabilité de la décision.

**Suite** : à reprendre quand le MVP sera stabilisé. Les 3 cas flous (combat lancé pendant bénédiction, construction démarrée avec bonus Maçon, slot Architecte à l'expiration) seront tranchés à ce moment-là avec une vision plus claire des contraintes runtime.

## Symptôme

`docs/gameplay/05-events-and-retention.md:71-88` — bénédictions 4 h. Effets ponctuels (« +20 % butin sur barbares », « +1 slot construction ») ou continus (« Production globale +8 % ») mélangés sans règle d'application temporelle.

Cas flous :
- Combat lancé pendant la bénédiction Forgeron, résolu après timeout : bonus appliqué ?
- Construction démarrée avec bonus Maçon, finit après timeout : durée raccourcie reste ?
- Slot construction supplémentaire (Architecte) : à l'expiration, l'upgrade en cours sur le slot extra annulé / mis en pause / continue ?

Même question pour les Oyez (durée 24 h - 7 jours).

## Question à trancher

Règle uniforme par catégorie de bonus :
- **Snapshot au démarrage** (combat/upgrade lancé sous bénédiction → bonus garanti jusqu'à fin) ?
- **Continuous check** (bonus actif uniquement quand timer actif, perdu sinon) ?

Documenter dans `05-events-and-retention.md`.
