import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestListener,
} from '@apollo/server';
import { randomUUID } from 'crypto';
import { hostname } from 'os';
import pino from 'pino';
import { GraphQLError } from 'graphql';

const SERVICE_NAME = 'auth-service';
const SERVICE_VERSION = process.env.npm_package_version || '1.0.0';
const HOSTNAME = hostname();

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  base: null,
});

const HTTP_STATUS_TO_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  500: 'INTERNAL_SERVER_ERROR',
};

function getErrorCode(error: GraphQLError): string {
  const extensions = error.extensions as Record<string, unknown>;

  if (extensions?.code && extensions.code !== 'INTERNAL_SERVER_ERROR') {
    return extensions.code as string;
  }

  const originalError = error.originalError as { status?: number; statusCode?: number; getStatus?: () => number };

  const statusCode =
    originalError?.status ||
    originalError?.statusCode ||
    (typeof originalError?.getStatus === 'function' ? originalError.getStatus() : null) ||
    (extensions?.originalError as Record<string, unknown>)?.statusCode;

  if (statusCode && HTTP_STATUS_TO_CODE[statusCode as number]) {
    return HTTP_STATUS_TO_CODE[statusCode as number];
  }

  return 'INTERNAL_SERVER_ERROR';
}

@Plugin()
export class GraphQLLoggingPlugin implements ApolloServerPlugin<BaseContext> {
  async requestDidStart(
    requestContext,
  ): Promise<GraphQLRequestListener<BaseContext>> {
    const { operationName, variables } = requestContext.request;
    const startTime = Date.now();
    const traceId =
      requestContext.contextValue?.req?.headers?.['x-trace-id'] || randomUUID();

    if (requestContext.contextValue?.req) {
      requestContext.contextValue.req.traceId = traceId;
    }

    let errorInfo: { message: string; code: string; path: string[] } | null =
      null;

    return {
      didEncounterErrors: async ({ errors }) => {
        const firstError = errors[0];
        if (firstError) {
          errorInfo = {
            message: firstError.message,
            code: getErrorCode(firstError),
            path: firstError.path as string[],
          };
        }
      },
      willSendResponse: async () => {
        if (operationName === 'IntrospectionQuery') return;

        const duration = Date.now() - startTime;
        const userId = requestContext.contextValue?.req?.user?.id || null;

        const logData = {
          traceId,
          service: SERVICE_NAME,
          version: SERVICE_VERSION,
          hostname: HOSTNAME,
          env: process.env.NODE_ENV || 'development',
          operation: operationName || 'anonymous',
          variables: this.redactSensitive(variables),
          userId,
          durationMs: duration,
          status: errorInfo ? 'error' : 'success',
          ...(errorInfo && { error: errorInfo }),
        };

        if (errorInfo) {
          logger.error(logData);
        } else {
          logger.info(logData);
        }
      },
    };
  }

  private redactSensitive(
    variables: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined {
    if (!variables) return undefined;

    const redact = (obj: Record<string, unknown>): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (['password', 'token', 'refreshToken', 'accessToken'].includes(key)) {
          result[key] = '[REDACTED]';
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = redact(value as Record<string, unknown>);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return redact(variables);
  }
}
