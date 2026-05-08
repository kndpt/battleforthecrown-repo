# 17 — Statut de `src/pixi/manifest.ts` à confirmer (utilisé ou dead code)

**Statut** : ✅ Fermé le 2026-05-08 (audit obsolète)
**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-pixi`
**Tags** : dead-code-suspect, pixi, assets, investigation

## Résolution

Verdict après investigation : **A. Activement utilisé** (cas 1 du ticket).

- Le fichier a été déplacé en `battleforthecrown-pixi/src/pixi/assets/manifest.ts` (l'audit pointait l'ancien chemin `src/pixi/manifest.ts`).
- Il exporte `BUILDING_TEXTURE_KEYS`, `VILLAGE_BUNDLE`, `WORLD_MAP_BUNDLE`, `BOOT_BUNDLE`, `PIXI_BUNDLES` et la fonction idempotente `registerPixiBundles()` qui appelle `Assets.init({ manifest: { bundles: PIXI_BUNDLES } })`.
- Chaîne de chargement active : `manifest.ts` → `loader.ts:loadBundle` (appelle `registerPixiBundles()` puis `Assets.loadBundle`) → consommé par `VillageCanvas.tsx:30` (bundle `village`) et `WorldMapCanvas.tsx:119` (bundle `world-map`).
- `manifest.test.ts` valide la structure des bundles.

Aucune action de code requise. Ticket fermé sans modification.

## Symptôme

Le fichier `battleforthecrown-pixi/src/pixi/manifest.ts` (~2.2 K) déclare un manifeste d'assets Pixi. Le rapport Phase A le signale comme potentiellement non utilisé : `loader.ts` (608 B) charge des assets, mais le lien avec `manifest.ts` n'a pas été tracé pendant l'audit. Le statut réel doit être confirmé avant toute décision.

À ne pas confondre avec `src/features/ui-test/` (showcase du design system, **conservé** par décision utilisateur du 2026-05-06).

## Localisation

- `battleforthecrown-pixi/src/pixi/manifest.ts`
- `battleforthecrown-pixi/src/pixi/loader.ts`
- À investiguer : tous les imports de `manifest`, `MANIFEST`, `assetManifest` ou nom équivalent dans le frontend.

## Détail technique

Pixi v8 a un système de manifest natif (`Assets.init({ manifest: ... })`) qui permet de charger des bundles d'assets nommés à la demande. Le fichier `manifest.ts` ressemble à une déclaration de ce type. Mais si `loader.ts` charge les assets autrement (URL directe, bundle hardcodé, import statique), le manifest est dead code.

Trois cas possibles à élucider :

1. **Activement utilisé** — `loader.ts` (ou une autre couche d'init Pixi) importe `manifest.ts` et appelle `Assets.init({ manifest })`. Tout va bien, à documenter.
2. **Référencé sans être consommé** — import présent mais jamais lu (effet de bord, ou résidu de refacto).
3. **Dead code complet** — aucun consommateur dans le repo. Reste d'une approche abandonnée.

Investigation minimale :
- `grep -rn "from.*manifest" battleforthecrown-pixi/src/`
- `grep -rn "manifest" battleforthecrown-pixi/src/pixi/`
- Lecture de `loader.ts` et trace de la chaîne de chargement au boot de l'application.

## Impact

- **Si dead code** : ~2.2 K de code mort, confusion possible pour un nouveau dev qui pense que c'est la source de vérité des assets.
- **Si actif mais non documenté** : risque de divergence (ajouter un asset sans le déclarer dans le manifest = chargement raté en silence).
- **Si bypass partiel** : pire des deux mondes — le manifest existe, certains chemins l'utilisent, d'autres non.

## Contexte

Ticket de **basse priorité** créé pour ne pas perdre l'observation. À traiter quand on touche le boot Pixi ou le chargement d'assets pour une autre raison. Pas de blocage immédiat.

## Pistes à explorer

- **Investigation d'abord, décision ensuite** : ce ticket est avant tout un ticket d'enquête, pas de refacto.
- Si dead code confirmé : suppression simple (un seul fichier + son éventuelle référence orpheline).
- Si actif : commentaire d'en-tête expliquant le rôle, et idéalement test ou lint qui détecte un asset utilisé non déclaré.
- Si partiellement utilisé : décider d'unifier (tout par le manifest) ou de supprimer (tout par chargement direct).

## Tickets liés

- Aucun direct.

## Dimensions à valider en sortie

- Statut documenté (utilisé / non utilisé / partiel).
- Si supprimé : aucun warning runtime sur le chargement d'assets, build OK, dev mode OK.
- Si conservé : commentaire d'en-tête + idéalement garde structurelle (test ou lint) garantissant la cohérence avec les assets réellement chargés.
