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
    openToLocked: number;
    lockedToEnded: number;
  }> {
    // Garantir un monde joignable « frais » AVANT d'ouvrir les PLANNED : si la
    // cadence est échue, le monde créé ici (`plannedOpenAt = now`) est ouvert
    // dans le même tick par `openPlannedWorlds`.
    const plannedCreated = await this.ensurePlannedPipeline(now);
    const plannedToOpen = await this.openPlannedWorlds(now);
    const openToLocked = await this.lockExpiredRegistrationWindows(now);
    const lockedToEnded = await this.endExpiredWorlds(now);

    if (plannedCreated + plannedToOpen + openToLocked + lockedToEnded > 0) {
      this.logger.log(
        `World lifecycle transitions: plannedCreated=${plannedCreated}, plannedToOpen=${plannedToOpen}, openToLocked=${openToLocked}, lockedToEnded=${lockedToEnded}`,
      );
    }

    return { plannedCreated, plannedToOpen, openToLocked, lockedToEnded };
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
