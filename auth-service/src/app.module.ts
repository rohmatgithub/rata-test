import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
import { GraphQLFormattedError } from 'graphql';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GraphQLLoggingPlugin } from './common/plugins/graphql-logging.plugin';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      providers: [],
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
        const enablePlayground = configService.get('GRAPHQL_PLAYGROUND') === 'true' || !isProduction;
        const enableIntrospection = configService.get('GRAPHQL_INTROSPECTION') === 'true' || !isProduction;
        return {
          autoSchemaFile: true,
          sortSchema: true,
          playground: enablePlayground,
          introspection: enableIntrospection,
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
    AuthModule,
  ],
  providers: [GraphQLLoggingPlugin],
})
export class AppModule {}
