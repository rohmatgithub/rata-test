import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleService } from './schedule.service';
import { ScheduleResolver } from './schedule.resolver';
import { CommonModule } from '../common/common.module';

export const EMAIL_QUEUE = 'email-queue';

@Module({
  imports: [
    CommonModule,
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  providers: [ScheduleService, ScheduleResolver],
  exports: [ScheduleService],
})
export class ScheduleModule {}
