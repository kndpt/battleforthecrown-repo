import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import type { Prisma, TrainingBuilding } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { OutboxPublisher } from '../modules/event/outbox-publisher.service';
import { registerJobQueueWorker } from '../infra/pg-boss/queue-worker.helper';
import PgBoss from 'pg-boss';

interface TrainingJob {
  trainingId: string;
  villageId: string;
  unitType: string;
}

@Injectable()
export class TrainingWorker implements OnModuleInit {
  private readonly logger = new Logger(TrainingWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxPublisher,
  ) {}

  async onModuleInit() {
    await registerJobQueueWorker<TrainingJob>(
      this.boss,
      this.logger,
      { queueName: 'training:tick', displayName: 'Training' },
      (data) => this.handleTrainingTick(data),
    );
  }

  private async handleTrainingTick(data: TrainingJob) {
    this.logger.log(`Processing training tick: ${data.trainingId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Get training record
        const training = await tx.unitTraining.findUnique({
          where: { id: data.trainingId },
        });

        if (!training) {
          this.logger.warn(`Training ${data.trainingId} not found, skipping`);
          return;
        }

        // Check if training was cancelled or already completed
        if (training.completedQty >= training.totalQty) {
          this.logger.log(
            `Training ${data.trainingId} already completed, skipping`,
          );
          return;
        }

        // Increment completed quantity
        const newCompletedQty = training.completedQty + 1;
        const isComplete = newCompletedQty >= training.totalQty;

        // Update or upsert unit inventory
        await tx.unitInventory.upsert({
          where: {
            villageId_unitType: {
              villageId: data.villageId,
              unitType: data.unitType,
            },
          },
          create: {
            villageId: data.villageId,
            unitType: data.unitType,
            quantity: 1,
          },
          update: {
            quantity: { increment: 1 },
          },
        });

        await this.outbox.unitTrained(
          {
            trainingId: data.trainingId,
            villageId: data.villageId,
            unitType: data.unitType,
            completedQty: newCompletedQty,
            totalQty: training.totalQty,
          },
          tx,
        );

        if (isComplete) {
          // Training complete, delete record
          await tx.unitTraining.delete({
            where: { id: data.trainingId },
          });

          // Create event in outbox
          await this.outbox.unitTrainingCompleted(
            {
              trainingId: data.trainingId,
              villageId: data.villageId,
              unitType: data.unitType,
              completedQty: training.totalQty,
              totalQty: training.totalQty,
            },
            tx,
          );

          this.logger.log(
            `Training ${data.trainingId} completed: ${training.totalQty} ${data.unitType}`,
          );

          // Promote the next queued training for the same building (sequential
          // queue, run 062): the oldest remaining row becomes head and gets its
          // first pg-boss tick. Deferred rows had no job until now.
          await this.scheduleNextInQueue(
            tx,
            training.villageId,
            training.building,
          );
        } else {
          // Schedule next tick
          const nextUnitEta = new Date(Date.now() + training.timePerUnitMs);

          await tx.unitTraining.update({
            where: { id: data.trainingId },
            data: {
              completedQty: newCompletedQty,
              nextUnitEta,
            },
          });

          // Schedule next job
          await this.boss.send(
            'training:tick',
            {
              trainingId: data.trainingId,
              villageId: data.villageId,
              unitType: data.unitType,
            },
            {
              startAfter: nextUnitEta,
              singletonKey: `training:${data.trainingId}`,
            },
          );

          this.logger.log(
            `Training ${data.trainingId}: ${newCompletedQty}/${training.totalQty} units completed`,
          );
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to process training tick for ${data.trainingId}:`,
        error,
      );
      throw error; // pg-boss will retry
    }
  }

  /**
   * Promote the oldest remaining training of `(villageId, building)` to head:
   * refresh its `nextUnitEta` and schedule its first pg-boss tick. No-op when
   * the queue is empty. Called inside the completing transaction so the just
   * deleted head is excluded from the lookup.
   */
  private async scheduleNextInQueue(
    tx: Prisma.TransactionClient,
    villageId: string,
    building: TrainingBuilding,
  ) {
    const next = await tx.unitTraining.findFirst({
      where: { villageId, building },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    if (!next) return;

    const nextUnitEta = new Date(Date.now() + next.timePerUnitMs);
    await tx.unitTraining.update({
      where: { id: next.id },
      data: { nextUnitEta },
    });

    await this.boss.send(
      'training:tick',
      { trainingId: next.id, villageId, unitType: next.unitType },
      {
        startAfter: nextUnitEta,
        singletonKey: `training:${next.id}`,
      },
    );

    this.logger.log(
      `Promoted next training ${next.id} (${next.unitType}) for village ${villageId}`,
    );
  }
}
