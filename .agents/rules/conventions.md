---
description: Conventions techniques transversales (TS strict, yarn, server-authoritative, Outbox, static-check).
alwaysApply: true
---

# Conventions techniques

Ces règles s'appliquent à **tout le repo**, sauf cas explicite documenté dans le `CLAUDE.md` du workspace concerné.

## Langages et tooling

- **TypeScript strict** partout. Pas de `any` pour faire taire le compilateur — trouver une solution typée (génériques, narrowing, helpers).
- **Yarn**, jamais npm. Tous les workspaces sont déclarés dans le `package.json` racine.
- **TS 6 / Vite 8 / React 19** côté nouveau frontend. Voir `battleforthecrown-pixi/package.json` pour les versions exactes.

## Architecture serveur-autoritaire

- Le backend NestJS est l'**unique vérité** : ressources, queue, expéditions, soldes — tout est calculé serveur-side.
- Le frontend **interpole** entre les updates WebSocket pour l'affichage continu (ressources/heure, etc.).
- **Pattern Outbox** : toute mutation backend écrit dans `EventOutbox` dans la même transaction DB. Un worker `OutboxWorker` poll ~1s et émet via Socket.IO. Délai mutation → event WS : 0 à ~1s.
- Côté front : ne **jamais** calculer une valeur "autoritative" localement. Sur action user → mutation REST → invalidate cache TanStack Query → laisser le state se resynchroniser via REST + WS.

## Optimistic UI

Acceptable quand :
1. Le backend retourne 200/201 typiquement en <500ms.
2. Le rollback est trivial (annuler une insertion locale, restaurer une snapshot).
3. La cohérence des autres données (ressources, population) sera resynchronisée par les events WS.

Pattern : `onMutate` (snapshot + mutate cache) → `onError` (rollback via context) → `onSettled` (invalidate les keys liées).

## Lint / formatage

- ESLint flat config par workspace.
- Pas de prettier global imposé — chaque workspace garde le sien si pertinent.

## Vérification statique avant commit final

Avant tout commit final (étape 10 d'un `$bftc-run`, ou commit direct), lancer **à la racine** :

```bash
yarn static-check
```

Enchaîne `tsc --noEmit` + `eslint --quiet` (sans `--fix`) sur backend et pixi. Catch les erreurs que `yarn dev` masque (types manquants TS2739, règles ESLint en erreur, etc.) et qui ne sortent pas de `yarn test`, sans réimprimer les warnings baseline connus ni le warning externe `baseline-browser-mapping`.

⚠️ Utiliser `static-check` ou `lint:check --quiet`, **jamais `yarn lint`** — cette dernière a `--fix` côté backend et mute les fichiers en silence.

Si `static-check` échoue : fix les erreurs (ou justifie via une dérogation explicite dans le commit body / fiche de run). **Pas de `--no-verify` pour bypass.**

## Sécurité

- JWT en `Authorization: Bearer …` côté REST, en `auth: { token }` côté Socket.IO.
- Refresh automatique sur 401 (cf. `ApiClient.tryRefresh`).
- Aucun secret en dur dans le code.
