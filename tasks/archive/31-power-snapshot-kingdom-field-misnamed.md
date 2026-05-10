# 31 — `PowerSnapshot.kingdom` : champ DB sémantiquement faux

**Sévérité** : 🟡 Majeure
**Statut** : 🆕 Ouvert 2026-05-10 (issue de [run 000](./runs/000-pilote-audit-power.md))

## Symptôme

Le modèle Prisma `PowerSnapshot` (`battleforthecrown-backend/prisma/schema.prisma`) déclare :

```prisma
model PowerSnapshot {
  villageId String   @map("village_id")
  total     Int
  kingdom   Int  // ← stocke en réalité la Puissance Bâtiments d'UN village
  army      Int
  createdAt DateTime @default(now()) @map("created_at")

  village Village @relation(fields: [villageId], references: [id], onDelete: Cascade)

  @@id([villageId, createdAt])
  @@map("power_snapshot")
}
```

Le code reconnaît la confusion :

```ts
// battleforthecrown-backend/src/modules/power/power.service.ts:87-94
return prisma.powerSnapshot.create({
  data: {
    villageId,
    total: scores.total,
    kingdom: scores.building, // Note: DB field still named 'kingdom' but represents building power
    army: scores.army,
  },
});
```

Sémantiquement, `kingdom` = « royaume » dans la spec [`09-power-and-rankings.md`](../docs/gameplay/09-power-and-rankings.md#calcul) : *« Puissance d'un royaume = somme des puissances de tous les villages possédés »*. Or le champ stocke la **puissance bâtiments d'un village unique**. Pollution sémantique :

- Lecture future ambigüe (un dev qui débarque interprète mal).
- `getLeaderboard` utilise déjà la confusion en triant `type='kingdom'` par puissance bâtiment-village (cf. finding F3 du run 000).
- Si le run [29](./29-power-public-visibility-missing.md) ajoute une colonne dédiée à la *vraie* puissance royaume (snapshot historique), le clash de noms devient critique.

## État actuel

- 1 modèle Prisma avec champ mal nommé (`kingdom`).
- 1 caller (`PowerService.calculateAndSave`) qui contourne avec un commentaire inline.
- 1 caller en aval (`combat/conquest.service.ts:126`) qui ignore le détail.
- Aucune migration récente liée à `PowerSnapshot` dans `prisma/migrations/`.

## Pistes

### Piste A — Renommer `kingdom` → `buildings` (migration Prisma)

1. Créer une migration `rename_powersnapshot_kingdom_to_buildings` :
   ```sql
   ALTER TABLE "power_snapshot" RENAME COLUMN "kingdom" TO "buildings";
   ```
2. Update `schema.prisma` : `buildings Int`.
3. Update `PowerService.calculateAndSave` : `buildings: scores.building`.
4. `yarn prisma generate` puis `yarn prisma migrate deploy` en local.

**Tradeoff** : Léger en code mais migration DB en prod = downtime nul (un seul `RENAME COLUMN`). Pas de rollback gratuit si une instance lit l'ancien nom — coordonner avec le déploiement.

### Piste B — Drop & rebuild (table jamais vraiment consommée ?)

Si `PowerSnapshot` n'est lu nulle part hors de l'écriture par `calculateAndSave` (à vérifier — grep `powerSnapshot.findMany`/`findFirst`/`findUnique`/`groupBy` côté backend), c'est de la donnée morte. On peut :

1. Supprimer le modèle entier (`schema.prisma` + migration) si aucun usage en lecture.
2. Réintroduire un modèle propre quand le besoin réel se manifeste (ranking historique, par exemple).

**Tradeoff** : Plus simple, supprime aussi le commentaire de honte. Risque : perdre des snapshots historiques si jamais ils servent à du backfill futur.

### Piste C — Garder le nom, ajouter un champ correctement nommé

`buildings Int` ajouté, `kingdom` déprécié et progressivement abandonné. Plus de migration mais surface DB plus large. À éviter.

## Question à trancher

1. Le modèle `PowerSnapshot` est-il **lu quelque part** ? Si non → Piste B (drop). Si oui → Piste A (rename).
2. Si rename : ok pour migration en local immédiate (DB locale = lecture seule sauf `prisma migrate dev` autorisé, cf. [feedback memory](../.claude/projects/.../memory/feedback_db_locale_lecture_seule.md)) puis déploiement coordonné en prod ?

## Référence audit

Run pilote 000 — `## Décisions prises § T3` (écart MAJ4).
