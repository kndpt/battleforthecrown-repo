import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, type World, type WorldStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import PgBoss from 'pg-boss';
import { PrismaService } from '../infra/prisma/prisma.service';
import { PrismaClientOrTx } from '../common/prisma.types';
import { registerScheduledQueueWorker } from '../infra/pg-boss/queue-worker.helper';
import { createOutboxEvent } from '../modules/event/event.utils';
import { RankingsService } from '../modules/rankings/rankings.service';
import { RenownService } from '../modules/renown/renown.service';
import { CosmeticAwardService } from '../modules/cosmetic/cosmetic-award.service';
import {
  DEFAULT_WORLD_CONFIG,
  WorldConfigSchema,
  resolveWorldLifecycleConfig,
  type WorldConfig,
} from '@battleforthecrown/shared/world';
import { MS_PER_DAY } from '@battleforthecrown/shared/time';
import {
  computeNextPlannedOpenAt,
  deriveAutoWorldIdentity,
} from './world-spawner.logic';

const WORLD_LIFECYCLE_QUEUE = 'world:lifecycle';
const WORLD_LIFECYCLE_CRON = '*/5 * * * *';

/**
 * Garde-fou anti-bug : ne jamais noyer la liste publique de mondes auto-créés.
 * Plafond souple, pas une règle gameplay (run 064).
 */
const MAX_ACTIVE_WORLDS = 50;

/**
 * Clé constante de `pg_try_advisory_xact_lock` sérialisant la création de monde
 * entre instances pg-boss. Combinée au check `count(PLANNED) === 0` dans la même
 * transaction, elle garantit qu'un seul monde PLANNED est créé par fenêtre.
 */
const WORLD_SPAWNER_LOCK_KEY = 8_064_064_064;

@Injectable()
export class WorldLifecycleWorker implements OnModuleInit {
  private readonly logger = new Logger(WorldLifecycleWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
    private readonly rankings: RankingsService,
    private readonly renown: RenownService,
    private readonly cosmeticAwards: CosmeticAwardService,
  ) {}

  async onModuleInit() {
    await registerScheduledQueueWorker(
      this.boss,
      this.logger,
      {
        queueName: WORLD_LIFECYCLE_QUEUE,
        cron: WORLD_LIFECYCLE_CRON,
        tz: 'UTC',
        displayName: 'World lifecycle',
      },
      () => this.handleLifecycleTick(),
    );
  }

  async handleLifecycleTick(now = new Date()): Promise<{
    plannedCreated: number;
    plannedToOpen: number;
    inscriptionPhaseChanged: number;
    openToLocked: number;
    lockedToEnded: number;
    endedToArchived: number;
  }> {
    // Garantir un monde joignable « frais » AVANT d'ouvrir les PLANNED : si la
    // cadence est échue, le monde créé ici (`plannedOpenAt = now`) est ouvert
    // dans le même tick par `openPlannedWorlds`.
    const plannedCreated = await this.ensurePlannedPipeline(now);
    const plannedToOpen = await this.openPlannedWorlds(now);
    const inscriptionPhaseChanged = await this.handlePhaseTransitions(now);
    const openToLocked = await this.lockExpiredRegistrationWindows(now);
    const lockedToEnded = await this.endExpiredWorlds(now);
    const endedToArchived = await this.archiveEndedWorlds(now);

    if (
      plannedCreated +
        plannedToOpen +
        inscriptionPhaseChanged +
        openToLocked +
        lockedToEnded +
        endedToArchived >
      0
    ) {
      this.logger.log(
        `World lifecycle transitions: plannedCreated=${plannedCreated}, plannedToOpen=${plannedToOpen}, inscriptionPhaseChanged=${inscriptionPhaseChanged}, openToLocked=${openToLocked}, lockedToEnded=${lockedToEnded}, endedToArchived=${endedToArchived}`,
      );
    }

    return {
      plannedCreated,
      plannedToOpen,
      inscriptionPhaseChanged,
      openToLocked,
      lockedToEnded,
      endedToArchived,
    };
  }

  /**
   * Sous-flag distinct du `WorldStatus` : à `startedAt + inscriptionMainDays`,
   * la cohorte principale est complète et le monde bascule en inscription
   * « retardataires ». Le monde reste `OPEN` — on émet seulement un signal
   * serveur (`world.inscription-phase.changed`) pour que le front rafraîchisse
   * la liste publique et affiche le bandeau (run 069) sans refetch manuel.
   *
   * Idempotence : `inscriptionPhaseTransitionedAt` est persisté dans la même
   * transaction que l'event via un `updateMany` conditionnel (colonne null) ;
   * un monde déjà transitionné n'émet plus rien aux ticks suivants.
   */
  private async handlePhaseTransitions(now: Date): Promise<number> {
    const worlds = await this.prisma.world.findMany({
      where: {
        status: 'OPEN',
        startedAt: { not: null },
        inscriptionPhaseTransitionedAt: null,
      },
      orderBy: { startedAt: 'asc' },
    });

    let transitions = 0;
    for (const world of worlds) {
      if (!world.startedAt) continue;

      const lifecycle = this.getLifecycle(world);
      const phaseAt = addDays(world.startedAt, lifecycle.inscriptionMainDays);
      if (phaseAt > now) continue;

      transitions += await this.prisma.$transaction(async (tx) => {
        const updated = await tx.world.updateMany({
          where: {
            id: world.id,
            status: 'OPEN',
            inscriptionPhaseTransitionedAt: null,
          },
          data: { inscriptionPhaseTransitionedAt: now },
        });

        if (updated.count !== 1) {
          return 0;
        }

        await createOutboxEvent(
          tx,
          'world.inscription-phase.changed',
          world.id,
          {
            worldId: world.id,
            from: 'main',
            to: 'late',
            at: now.toISOString(),
          },
        );

        return 1;
      });
    }
    return transitions;
  }

  /**
   * Garantit qu'un monde joignable « frais » existe pour les latecomers. Ne crée
   * rien si un monde PLANNED existe déjà (invariant primaire), si le système est
   * saturé, ou si la cadence `newWorldEverydays` n'est pas encore échue.
   *
   * La transaction prend un advisory lock pour sérialiser la création entre
   * instances ; le perdant du lock ne fait rien ce tick.
   */
  private async ensurePlannedPipeline(now: Date): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const [{ locked }] = await tx.$queryRaw<{ locked: boolean }[]>(
        Prisma.sql`SELECT pg_try_advisory_xact_lock(${WORLD_SPAWNER_LOCK_KEY}::bigint) AS locked`,
      );
      if (!locked) {
        return 0;
      }

      // Invariant primaire : un monde frais existe déjà → rien à faire.
      const plannedCount = await tx.world.count({
        where: { status: 'PLANNED' },
      });
      if (plannedCount > 0) {
        return 0;
      }

      // Garde-fou souple : ne pas noyer la liste publique en cas de bug.
      const activeCount = await tx.world.count({
        where: { status: { in: ['PLANNED', 'OPEN', 'LOCKED'] } },
      });
      if (activeCount >= MAX_ACTIVE_WORLDS) {
        return 0;
      }

      const totalWorlds = await tx.world.count();
      const lastStarted = await tx.world.findFirst({
        where: { startedAt: { not: null } },
        orderBy: { startedAt: 'desc' },
        select: { startedAt: true },
      });

      // Des mondes existent mais aucun n'a démarré et aucun n'est PLANNED : état
      // dégénéré improbable. Ne pas prendre la branche bootstrap (réservée à la
      // DB strictement vide) pour rester idempotent.
      if (!lastStarted && totalWorlds > 0) {
        return 0;
      }

      const template = await this.resolveTemplateConfig(tx);
      const plannedOpenAt = computeNextPlannedOpenAt(
        lastStarted?.startedAt ?? null,
        template.lifecycle.newWorldEverydays,
        now,
      );
      if (plannedOpenAt === null) {
        return 0;
      }

      const { name, identity } = deriveAutoWorldIdentity(totalWorlds);
      const worldId = randomUUID();
      const config: WorldConfig = { ...template, identity };
      await tx.world.create({
        data: {
          id: worldId,
          name,
          status: 'PLANNED',
          plannedOpenAt,
          config,
        },
      });
      await createOutboxEvent(tx, 'world.planned.created', worldId, {
        worldId,
        plannedOpenAt: plannedOpenAt.toISOString(),
        source: 'auto',
      });
      return 1;
    });
  }

  /**
   * Config canonique héritée par un monde auto-créé : le monde `default` (inséré
   * par la migration `add_world_entity`, configuré par `seed-default-world-config.sql`)
   * s'il existe — respecte un éventuel tuning prod — sinon la constante partagée
   * `DEFAULT_WORLD_CONFIG` (bootstrap DB vide / smoke à table tronquée). L'identité
   * est écrasée par l'appelant.
   */
  private async resolveTemplateConfig(
    tx: PrismaClientOrTx,
  ): Promise<WorldConfig> {
    const defaultWorld = await tx.world.findUnique({
      where: { id: 'default' },
      select: { config: true },
    });
    if (defaultWorld) {
      const parsed = WorldConfigSchema.safeParse(defaultWorld.config);
      if (parsed.success) {
        return parsed.data;
      }
      this.logger.warn(
        `Default world config invalid (${parsed.error.message}); falling back to DEFAULT_WORLD_CONFIG`,
      );
    }
    return DEFAULT_WORLD_CONFIG;
  }

  private async openPlannedWorlds(now: Date): Promise<number> {
    const worlds = await this.prisma.world.findMany({
      where: {
        status: 'PLANNED',
        plannedOpenAt: { lte: now },
      },
      orderBy: { plannedOpenAt: 'asc' },
    });

    let transitions = 0;
    for (const world of worlds) {
      const lifecycle = this.getLifecycle(world);
      const startedAt = now;
      const endsAt = addDays(startedAt, lifecycle.worldDuration);
      transitions += await this.transitionWorld(world.id, 'PLANNED', 'OPEN', {
        startedAt,
        endsAt,
        at: now,
      });
    }
    return transitions;
  }

  private async lockExpiredRegistrationWindows(now: Date): Promise<number> {
    const worlds = await this.prisma.world.findMany({
      where: {
        status: 'OPEN',
        startedAt: { not: null },
      },
      orderBy: { startedAt: 'asc' },
    });

    let transitions = 0;
    for (const world of worlds) {
      if (!world.startedAt) continue;

      const lifecycle = this.getLifecycle(world);
      const lockAt = addDays(
        world.startedAt,
        lifecycle.inscriptionMainDays + lifecycle.inscriptionLateDays,
      );
      if (lockAt > now) continue;

      transitions += await this.transitionWorld(world.id, 'OPEN', 'LOCKED', {
        at: now,
      });
    }
    return transitions;
  }

  private async endExpiredWorlds(now: Date): Promise<number> {
    const worlds = await this.prisma.world.findMany({
      where: {
        status: 'LOCKED',
        endsAt: { lte: now },
      },
      orderBy: { endsAt: 'asc' },
    });

    let transitions = 0;
    for (const world of worlds) {
      transitions += await this.transitionWorld(world.id, 'LOCKED', 'ENDED', {
        at: now,
      });
    }
    return transitions;
  }

  /**
   * Fin de vie d'un monde : `archiveAfterDays` (default 7 j) après `endsAt`, la
   * fenêtre de consultation read-only `ENDED` expire. Le monde passe `ENDED →
   * ARCHIVED` et toutes ses données joueur sont purgées dans la **même
   * transaction**. Le monde lui-même est conservé (`status = ARCHIVED`) pour
   * préserver les FK des entités durables (rapports, snapshots, memberships).
   */
  private async archiveEndedWorlds(now: Date): Promise<number> {
    const worlds = await this.prisma.world.findMany({
      where: {
        status: 'ENDED',
        endsAt: { not: null },
      },
      orderBy: { endsAt: 'asc' },
    });

    let transitions = 0;
    for (const world of worlds) {
      if (!world.endsAt) continue;

      const lifecycle = this.getLifecycle(world);
      const archiveAt = addDays(world.endsAt, lifecycle.archiveAfterDays);
      if (archiveAt > now) continue;

      transitions += await this.archiveWorld(world.id, now);
    }
    return transitions;
  }

  /**
   * Transition `ENDED → ARCHIVED` + purge atomique des données joueur scopées au
   * monde. Un `updateMany` conditionnel (`status = ENDED`) garantit l'idempotence
   * et l'atomicité : un monde déjà archivé (`count !== 1`) ne purge rien et
   * n'émet aucun event. Échec partiel ⇒ rollback complet (status reste `ENDED`).
   *
   * Matrice de purge (run 065). Sont conservés : `World` (status ARCHIVED),
   * `WorldMembership` (relation user×world durable), tous les rapports
   * (`CombatReport`/`ScoutReport`/`ReinforcementReport`/`CaravanReport` +
   * `InboxEntry`), `GloryLedger`, `RenownLedger`, `WorldFinalRankingSnapshot`,
   * `GloryCycleSnapshot`, `RankingCycleTitleAward`, `UserWorldCosmeticAward` —
   * ces tables n'ont pas de FK cascade depuis `Village` (rapports = `worldId`
   * dénormalisé) et survivent puisque `World` n'est pas supprimé.
   */
  private async archiveWorld(worldId: string, now: Date): Promise<number> {
    return this.prisma.$transaction(
      async (tx) => {
        const updated = await tx.world.updateMany({
          where: { id: worldId, status: 'ENDED' },
          data: { status: 'ARCHIVED', archivedAt: now },
        });

        if (updated.count !== 1) {
          return 0;
        }

        // Tables `worldId` dénormalisées (pas de cascade Prisma) — purge explicite.
        await tx.expedition.deleteMany({ where: { worldId } });
        await tx.villageIntel.deleteMany({ where: { worldId } });
        await tx.mapMarker.deleteMany({ where: { worldId } });
        await tx.worldSeedState.deleteMany({ where: { worldId } });
        await tx.chunkSpawnState.deleteMany({ where: { worldId } });
        await tx.zoneCapacity.deleteMany({ where: { worldId } });
        await tx.crownBalance.deleteMany({ where: { worldId } });
        // DailyCard cascade DailyCardTask ; OnboardingState cascade OnboardingStepProgress.
        await tx.dailyCard.deleteMany({ where: { worldId } });
        await tx.dailyOyez.deleteMany({ where: { worldId } });
        await tx.onboardingState.deleteMany({ where: { worldId } });
        // Village EN DERNIER : ses FK cascade (Building, ResourceStock, Population,
        // UnitInventory, UnitTraining, PendingConquest, VillageStrategyConfig,
        // Garrison) partent avec lui.
        await tx.village.deleteMany({ where: { worldId } });

        await createOutboxEvent(tx, 'world.status.changed', worldId, {
          worldId,
          from: 'ENDED',
          to: 'ARCHIVED',
          at: now.toISOString(),
        });

        return 1;
      },
      {
        // Purge multi-tables : le défaut Prisma (5 s) peut rollback sur un monde volumineux.
        maxWait: 10_000,
        timeout: 60_000,
      },
    );
  }

  private async transitionWorld(
    worldId: string,
    from: WorldStatus,
    to: WorldStatus,
    params: { at: Date; startedAt?: Date; endsAt?: Date },
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.world.updateMany({
        where: { id: worldId, status: from },
        data: {
          status: to,
          startedAt: params.startedAt,
          endsAt: params.endsAt,
          plannedOpenAt: to === 'OPEN' ? null : undefined,
        },
      });

      if (updated.count !== 1) {
        return 0;
      }

      await createOutboxEvent(tx, 'world.status.changed', worldId, {
        worldId,
        from,
        to,
        at: params.at.toISOString(),
      });

      // Snapshot final des 3 classements dans la MÊME transaction que la
      // transition : un monde ne peut jamais devenir ENDED sans son snapshot
      // (échec ⇒ rollback atomique). Source des cosmétiques permanents (run 067)
      // et de l'UI lecture seule (run 066).
      if (to === 'ENDED') {
        await this.rankings.snapshotFinalRankings(tx, worldId, params.at);
        // Permanent cosmetic titles read the snapshot rows just written above,
        // in the same transaction (run 067). Must run AFTER the snapshot.
        await this.cosmeticAwards.awardChampionsForWorld(
          tx,
          worldId,
          params.at,
        );
        await this.renown.creditRankingBonuses(tx, worldId);
      }

      return 1;
    });
  }

  private getLifecycle(world: Pick<World, 'id' | 'config'>) {
    const parsed = WorldConfigSchema.safeParse(world.config);
    if (!parsed.success) {
      throw new Error(
        `World ${world.id} has an invalid config: ${parsed.error.message}`,
      );
    }
    return resolveWorldLifecycleConfig(parsed.data.lifecycle);
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}
