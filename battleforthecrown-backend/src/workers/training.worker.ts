import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { OutboxPublisher } from '../modules/event/outbox-publisher.service';
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
    try {
      // Create the queue first if it doesn't exist
      await this.boss.createQueue('training:tick');

      // Then register the worker
      await this.boss.work('training:tick', async (jobs) => {
        const job = Array.isArray(jobs) ? jobs[0] : jobs;
        return this.handleTrainingTick(job.data as TrainingJob);
      });

      this.logger.log('Training worker initialized');
    } catch (error) {
      this.logger.error('Failed to initialize training worker:', error);
      throw error;
    }
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
}
