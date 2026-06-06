import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

export interface ScheduleEmailJobData {
  customerEmail: string;
  customerName: string;
  doctorName: string;
  objective: string;
  scheduledAt: string;
  duration?: number;
}

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<ScheduleEmailJobData, void, string>): Promise<void> {
    this.logger.log({
      msg: 'Processing email job',
      jobId: job.id,
      jobName: job.name,
      data: { ...job.data, customerEmail: '[REDACTED]' },
    });

    try {
      switch (job.name) {
        case 'schedule-created':
          await this.emailService.sendScheduleCreatedEmail({
            ...job.data,
            duration: job.data.duration || 30,
          });
          break;

        case 'schedule-deleted':
          await this.emailService.sendScheduleDeletedEmail(job.data);
          break;

        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }

      this.logger.log({
        msg: 'Email job completed',
        jobId: job.id,
        jobName: job.name,
      });
    } catch (error) {
      this.logger.error({
        msg: 'Email job failed',
        jobId: job.id,
        jobName: job.name,
        error: error.message,
      });
      throw error;
    }
  }
}
