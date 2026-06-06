import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get('NODE_ENV') === 'production' ? 'info' : 'debug',
          autoLogging: false,
          quietReqLogger: true,
          messageKey: 'msg',
          timestamp: () => `,"time":"${new Date().toISOString()}"`,
          formatters: {
            level: (label: string) => ({ level: label }),
          },
          base: {
            service: 'notification-service',
            env: configService.get('NODE_ENV') || 'development',
          },
        },
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
      }),
    }),
    EmailModule,
  ],
})
export class AppModule {}
