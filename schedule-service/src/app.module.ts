import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';
import { GraphQLFormattedError } from 'graphql';
import { redisStore } from 'cache-manager-ioredis-yet';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { CustomerModule } from './customer/customer.module';
import { DoctorModule } from './doctor/doctor.module';
import { ScheduleModule } from './schedule/schedule.module';
import { GraphQLLoggingPlugin } from './common/plugins/graphql-logging.plugin';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
        },
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
          ttl: 60 * 1000, // 60 seconds default TTL
        }),
      }),
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
          base: null,
        },
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
          autoSchemaFile: true,
          sortSchema: true,
          playground: !isProduction,
          introspection: !isProduction,
          context: ({ req }) => ({ req }),
          formatError: (error): GraphQLFormattedError => ({
            message: error.message,
            path: error.path,
            extensions: {
              code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
            },
          }),
        };
      },
    }),
    PrismaModule,
    CommonModule,
    CustomerModule,
    DoctorModule,
    ScheduleModule,
  ],
  providers: [GraphQLLoggingPlugin],
})
export class AppModule {}
