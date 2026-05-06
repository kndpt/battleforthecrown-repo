# 14 — Convention zod pour la validation des formulaires non appliquée côté frontend

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-pixi`
**Tags** : convention-drift, validation, forms

## Symptôme

`.claude/rules/conventions.md` documente l'usage de **zod** pour la validation des formulaires côté front. En pratique, aucun usage de zod n'est trouvé dans les écrans de formulaire (`LoginScreen`, `RegisterScreen`) : la validation est faite manuellement avec `useState` + checks ad-hoc.

## Localisation

- `src/features/auth/LoginScreen.tsx` — `useState` + validation manuelle.
- `src/features/auth/RegisterScreen.tsx` — idem.
- À auditer : autres écrans avec formulaires (création de monde, paramètres, etc.).

`package.json` contient bien `zod` en dépendance (utilisé côté backend pour les DTOs). Aucun import dans les formulaires React.

## Détail technique

La convention vise à :
1. Définir un schéma déclaratif partagé.
2. Inférer les types TypeScript du schéma (`z.infer`).
3. Avoir des messages d'erreur cohérents (i18n possible).
4. Re-valider la même donnée côté backend avec le **même schéma** (cohérence end-to-end).

L'implémentation actuelle :
- Validation locale ad-hoc, formats de message variables.
- Pas de partage avec le backend (qui valide via Zod côté NestJS — donc on a deux validations différentes pour la même donnée).
- Pas d'inférence de types (les types sont définis ailleurs, séparément).

## Impact

- **Cohérence end-to-end perdue** : un user peut soumettre un formulaire qui passe la validation front mais échoue côté back (ou inversement). UX dégradée et confusion.
- **Convention érodée** : règle écrite, jamais appliquée → érode la confiance dans toutes les conventions documentées.
- **Refacto futur** : appliquer zod sur les formulaires existants demande de toucher la majorité des écrans auth/onboarding.
- **Peut-être pas le bon outil** : la convention citait zod, mais le marché actuel pour les formulaires React est dominé par React Hook Form + Zod (combo) ou Tanstack Form. Question à reposer.

## Contexte

Les écrans auth ont probablement été écrits en premier, avec validation manuelle (rapide à coder, peu de champs). Personne n'a réappliqué la convention quand l'outillage a été décidé.

## Pistes à explorer

- **Appliquer la convention telle que documentée** : zod schemas dans chaque écran de formulaire, inférence types, validation `onSubmit`.
- **Choisir un combo plus complet** : React Hook Form + Zod resolver (intégration native, gestion errors/touched/dirty out-of-the-box).
- **Mutualiser avec le backend** : extraire les schémas zod dans `packages/shared/<domain>/schemas.ts`, importer côté front pour validation, côté back pour DTO. Une seule source de vérité pour la forme des inputs.
- **Décider de retirer la convention** : si le besoin n'est pas réel (peu de formulaires complexes), abandonner zod côté front et mettre à jour `.claude/rules/conventions.md`.
- **Audit complet** : lister tous les formulaires existants, classer par complexité.

## Décision validée

(2026-05-06, par l'utilisateur — option pragmatique)

- **Schémas Zod dans `packages/shared/<domain>/schemas.ts`** comme **source unique** des formes d'inputs. Le backend les consomme déjà via DTOs Zod ; le frontend importe les mêmes.
- **Hook custom léger côté front** (~15 lignes) qui appelle `.safeParse()` au submit, map les erreurs Zod vers le state du formulaire. Pas de lib externe ajoutée.
- **Pas de React Hook Form pour l'instant** — premature pour le volume actuel (< 10 formulaires simples).
- **Cible de bascule** documentée pour le futur : si un formulaire devient multi-step ou exige une validation croisée complexe, basculer alors sur RHF + `@hookform/resolvers/zod`.

L'agent suivant doit **planifier l'implémentation** :
1. Audit des formulaires existants (`LoginScreen`, `RegisterScreen`, autres).
2. Extraction des schémas vers `packages/shared/auth/schemas.ts` (et autres domaines selon besoin).
3. Design du hook custom (signature, gestion erreurs).
4. Application sur `LoginScreen` et `RegisterScreen` en premier.
5. Mise à jour de `.claude/rules/conventions.md` pour refléter le pattern réel.

## Tickets liés

- [11 — Optimistic UI asymétrique](./11-pixi-optimistic-ui-asymmetric.md) — autre exemple de convention non systématique.
- [04 — World config permissive typing](./04-world-config-permissive-typing.md) — relié : la décision Zod-in-shared y est aussi appliquée pour `WorldConfig`.

## Dimensions à valider en sortie

- Décision tranchée : appliquer zod, basculer sur React Hook Form + Zod, ou retirer la convention.
- Tous les formulaires existants suivent la décision.
- `.claude/rules/conventions.md` mis à jour pour refléter la réalité.
- Si zod : schémas mutualisés avec le backend via `packages/shared` quand c'est pertinent.
