# 16 — Pré-conquête : armée gagne mais Seigneur meurt

**Sévérité** : 🟠 Moyenne
**Statut** : ✅ Résolu 2026-05-09 (spec — implémentation jointe au flow conquête à venir)

## Résolution

**Constat** : `ConquestService.conquerVillage` existe mais n'est **appelé nulle part** côté code actuel. Le combat resolver actuel ne déclenche aucune logique de conquête. Donc le bug runtime n'existe pas — pure spec à trancher.

**Décision** : raid victorieux normal, Seigneur perdu sec.

- Conquête échoue (pas de Seigneur survivant pour s'installer).
- Loot ramené (raid militairement victorieux).
- Escorte rentre au village d'origine avec le loot.
- Coût Seigneur perdu sec (5 000 cour + 15 pop + ressources). Pas de compensation.

Choix « no loot » et « loot partiel 50% » écartés : l'armée a gagné le combat, ramener le butin est cohérent avec la mécanique raid. La punition est déjà significative (Seigneur = 3 upgrades fin de jeu cumulés perdus).

**Doc mise à jour** :
- `docs/gameplay/10-conquest.md` § Le Seigneur : nouveau sous-§ « Cas particulier : armée gagne le combat de pré-conquête mais le Seigneur meurt ».
- `docs/gameplay/04-combat.md` § Conquête : ajout d'une bullet *« Si le Seigneur fait partie des pertes »* avec lien vers le cas particulier.

**Implémentation** : à intégrer dans le worker post-combat le jour où la conquête sera câblée — il faudra vérifier `survivingUnits.NOBLE > 0` avant de scheduler la fenêtre de capture. Hors scope ce ticket.

## Symptôme

`docs/gameplay/04-combat.md:28` — conquête réussie ssi « toutes les troupes ennemies vaincues ET Seigneur survivant ».

Cas non traité : armée attaquante gagne le combat (toutes troupes ennemies tuées) mais le Seigneur meurt dans les pertes.

## Question à trancher

Comportement attendu :
- Loot ramené (raid victorieux normal) ?
- Conquête annulée → escorte survivante rentre au village d'origine ?
- Coût Seigneur (couronnes + ressources + 15 pop) perdu sec, sans contrepartie ?

Probable mais pas écrit. À ajouter dans `04-combat.md § Conquête` ou `10-conquest.md § Le Seigneur`.
