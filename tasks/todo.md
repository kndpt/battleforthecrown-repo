# Run 037 - Migration auth vers design-system

- [x] Preflight : valider worktree clean, lire fiche, rules, `SPEC.md`, specs source et lessons.
- [x] Cartographie : localiser routes auth, écrans legacy, mutations, store auth, composants design-system et tests existants.
- [x] Implémentation : remplacer les vues `/`, `/auth/login`, `/auth/register` par les composants auth design-system en conservant les submits réels.
- [x] Tests : ajouter un filet Vitest sur payload login/register, erreurs, navigation et actions landing selon auth.
- [x] Vérifications : lancer tests ciblés puis `type-check`, `build`, `lint:check --quiet`, `static-check`.
- [x] Review : effectuer review 5 axes + review indépendante si diff > 100 lignes, puis corriger les findings.
- [x] QA navigateur : vérifier routes auth en desktop/mobile et absence de scroll horizontal ou texte tronqué.
- [x] Clôture : impact docs, rapport final, archive du run, `tasks/README.md`, commit unique.

## Notes de plan

- `SPEC.md` §C/§S seulement : pas d'invariant auth durable à ajouter pour l'instant.
- Backend/shared hors scope : `packages/shared/src/auth/schemas.ts` et `battleforthecrown-backend/src/modules/auth` restent inchangés.
- Les contrôles design-system non supportés runtime (SSO, lien magique, visiteur, oubli password, blason) doivent être affichés inertes/disabled.

## Review

- Correctness : login/register conservent `loginSchema`/`registerSchema` et les payloads `{ email, password }`; confirmation locale non envoyée.
- Architecture : backend/shared hors scope, design-system rendu production avec wrapper responsive runtime.
- Review indépendante : `GO`; finding mineur `fields.lord` pour email résolu par `fields.email`.
- QA : tests ciblés, test workspace Pixi, type-check, build, lint, static-check et Playwright mobile/desktop verts.
- Docs : aucun changement nécessaire ; la doc auth canonique décrit déjà le contrat serveur inchangé.
