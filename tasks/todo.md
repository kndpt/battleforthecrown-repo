# Todo

## 2026-05-26 — Top menu visuel

- [x] Localiser les styles du top menu et confirmer le scope visuel.
- [x] Appliquer le fond brun/degrade et les deux boutons bois/bronze sans toucher au reste du header.
- [x] Verifier par tests cibles et serveur local.
- [x] Documenter le resultat et l'impact docs.

## Review

- Changements limites au fond du top menu et aux boutons precedent/suivant du village.
- Ajustement apres review visuelle : ombre des boutons adoucie.
- Ajustement UX : suppression de la ligne secondaire du header village ; la capitale remplace le label `Village` par `Capitale` et le bloc titre est centre verticalement.
- Bottom navigation : fond et bordure haute alignes sur le top menu.
- Village view : suppression du fond gradient parchment du wrapper parent, vraie source de la bande visible autour du bottom nav.
- Verification : `yarn workspace battleforthecrown-pixi test GameHeader.test.tsx`, `yarn workspace battleforthecrown-pixi type-check`, `yarn workspace battleforthecrown-pixi lint:check --quiet`.
- Serveur local lance : `http://127.0.0.1:5173/`.
- Browser in-app indisponible dans cette session (`iab` absent), donc pas de capture automatique.
- Docs : aucun changement necessaire.
