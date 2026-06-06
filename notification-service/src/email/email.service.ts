import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendScheduleCreatedEmail(data: {
    customerEmail: string;
    customerName: string;
    doctorName: string;
    objective: string;
    scheduledAt: string;
    duration: number;
  }): Promise<void> {
    const { customerEmail, customerName, doctorName, objective, scheduledAt, duration } = data;

    const scheduledDate = new Date(scheduledAt);
    const formattedDate = scheduledDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = scheduledDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.mailerService.sendMail({
      to: customerEmail,
      subject: 'Appointment Confirmation - Healthcare Scheduling',
      template: 'schedule-created',
      context: {
        customerName,
        doctorName,
        objective,
        date: formattedDate,
        time: formattedTime,
        duration,
      },
    });

    this.logger.log(`Schedule created email sent to ${customerEmail}`);
  }

  async sendScheduleDeletedEmail(data: {
    customerEmail: string;
    customerName: string;
    doctorName: string;
    objective: string;
    scheduledAt: string;
  }): Promise<void> {
    const { customerEmail, customerName, doctorName, objective, scheduledAt } = data;

    const scheduledDate = new Date(scheduledAt);
    const formattedDate = scheduledDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = scheduledDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.mailerService.sendMail({
      to: customerEmail,
      subject: 'Appointment Cancelled - Healthcare Scheduling',
      template: 'schedule-deleted',
      context: {
        customerName,
        doctorName,
        objective,
        date: formattedDate,
        time: formattedTime,
      },
    });

    this.logger.log(`Schedule deleted email sent to ${customerEmail}`);
  }
}
