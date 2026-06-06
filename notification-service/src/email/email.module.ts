import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';

export const EMAIL_QUEUE = 'email-queue';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST') || 'smtp.mailtrap.io',
          port: configService.get('SMTP_PORT') || 587,
          secure: false,
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.get('SMTP_FROM') || '"Healthcare Scheduling" <noreply@healthcare.com>',
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [EmailProcessor, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
