# 10 — Logging incohérent backend (Pino + `console.log`)

> ✅ **Résolu le 2026-05-06.** Voir section [Résolution](#résolution) en fin de ticket.

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend`
**Tags** : observability, logging, ops

## Symptôme

Le backend utilise Pino (logger structuré JSON) comme logger principal, mais ~11 occurrences de `console.log()` cohabitent. Les logs émis via `console.log` ne sont pas structurés, ne portent pas de contexte de requête, et ne sont pas configurables (niveau, transport, redaction).

## Localisation

D'après le rapport backend Phase A :

- `src/infra/pg-boss/pg-boss.module.ts:12-14` — `console.log('🚀 [PgBoss]...')`
- `src/modules/auth/auth.service.ts:118, 121, 134, 142, 146` — 5 occurrences
- `src/modules/village/village.service.ts:191, 249` — 2 occurrences

(Liste à compléter en grep `console\.` global pour exhaustivité.)

## Détail technique

Pino est déjà câblé via `nestjs-pino` (à confirmer en lisant `app.module.ts` / `main.ts`). Les services injectent normalement `Logger` ou utilisent `@InjectPinoLogger()`. Mais ces patterns ne sont pas systématiques.

Pourquoi `console.log` apparaît :
- Code écrit rapidement sans réfléchir au logger (debug en cours de dev).
- Logger non injecté dans certaines classes (modules d'infra `PgBossModule`).
- Inertie : on utilise ce qui est sous la main.

Conséquences techniques :
- En production, `console.log` écrit en JSON non structuré, mélangé avec les logs Pino structurés. Les outils d'agrégation (Grafana Loki, Datadog…) ne peuvent pas filtrer/trier proprement.
- Pas de niveau (info/warn/error). Un `console.log` est toujours visible.
- Pas de redaction automatique (Pino peut masquer des champs sensibles ; `console.log` non).

## Impact

- **Observabilité** : signaux mélangés, difficile de retrouver un trace ID ou un userId dans une investigation.
- **Bruit** : les emojis (`🚀 [PgBoss]`) en logs production polluent les outils.
- **Sécurité** : risque de log de tokens / mots de passe non redacted (à auditer dans `auth.service.ts:118-146` notamment).
- **Cohérence** : convention documentée non appliquée — érode la confiance dans les conventions.

## Contexte

Pattern classique de projet jeune : Pino installé mais utilisation pas encore systématique. À noter : le rapport backend mentionne aussi des emojis en logs (`🚀`, etc.) qui sont des debug-prints jamais retirés.

## Pistes à explorer

- **ESLint rule** : `no-console` (avec exception ciblée pour `console.error` au niveau `main.ts` si besoin du bootstrap).
- **Audit + remplacement** : grep `console\.`, remplacer par `Logger` injecté avec contexte.
- **Audit redaction** : pour `auth.service.ts`, vérifier qu'aucun token / refresh token / hashed password ne soit loggé.
- **Logger global pour les modules d'infra** : injecter Pino dans `PgBossModule`, retirer les `console.log`.
- **Niveau par module** : configurer Pino pour avoir des niveaux différents en dev vs prod.

## Tickets liés

- [01 — Auth via @Query](./01-backend-auth-userid-via-query.md) — pendant la refonte auth, en profiter pour vérifier les logs.

## Dimensions à valider en sortie

- Plus aucun `console.log` / `console.error` / `console.warn` dans `src/` (sauf `main.ts` pour le bootstrap, justifié).
- Une règle ESLint `no-console` active.
- Audit confirmant qu'aucun token / mot de passe n'est loggé.
- Logs de prod cohérents (tous structurés JSON avec contexte requête).

## Résolution

Résolu le 2026-05-06 par une intervention minimale (le ticket original surévaluait la gravité — pas de prod, pas d'agrégateur de logs, et l'audit a confirmé qu'aucun token n'était fuité).

### État au moment de la résolution

- Pino était déjà câblé (`LoggerModule.forRoot()` dans `app.module.ts`, `app.useLogger(app.get(Logger))` dans `main.ts`) — les ~23 services utilisant `new Logger(X.name)` sont automatiquement routés vers Pino.
- Restaient 9 `console.*` dans `src/`, dans 2 fichiers (le 3ᵉ fichier mentionné par l'audit, `village.service.ts`, avait déjà été nettoyé entre-temps).
- Audit sécurité : aucun token / hash / refresh token n'était effectivement loggé — uniquement userId, sessionId et booléens. Faux positif sur ce point.

### Changements appliqués

- **`src/modules/auth/auth.service.ts`** : suppression des 6 `console.*` dans `refresh()` (debug-prints d'investigation jamais nettoyés). Pas remplacés par `logger.debug` — n'avaient plus de valeur.
- **`src/infra/pg-boss/pg-boss.module.ts`** : remplacement des 3 `console.*` par `new Logger('PgBoss')` dans la factory + retrait des emojis (`🚀 ✅ ❌`).
- **`eslint.config.mjs`** : ajout de `'no-console': 'error'` avec exception pour `scripts/**`, `test/**` et `**/*.spec.ts` (debug en test ou CLI = OK).

### Volontairement non fait

- **Redaction Pino** (`redact: ['*.refreshToken', ...]`) : filet pour un risque qui ne s'est pas matérialisé. À ressortir si/quand le projet déploie en prod avec un agrégateur de logs.
- **Migration `new Logger()` → `@InjectPinoLogger()`** : refacto de 23 fichiers pour bénéfice marginal — `new Logger()` est déjà routé vers Pino par Nest.
