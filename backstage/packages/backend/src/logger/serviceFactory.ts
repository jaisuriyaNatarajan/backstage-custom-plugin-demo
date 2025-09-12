import {
  createServiceFactory,
  coreServices,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { logger as winstonLogger } from './index'; // your existing Winston instance

/**
 * Replace Backstage's default logger (pino) with our Winston logger.
 * This makes *all* internal logs (catalog, auth, techdocs, http router, etc.)
 * go through Winston -> Logstash -> Elasticsearch -> Kibana.
 */
export const winstonLoggerServiceFactory = createServiceFactory({
  service: coreServices.logger,
  deps: {},
  factory: async () => {
    // Implement the LoggerService interface by delegating to Winston
    const adapt = (base?: Record<string, unknown>): LoggerService => ({
      child(meta) {
        // Winston child loggers can be created if you want:
        // return adapt({ ...(base ?? {}), ...(meta ?? {}) });
        // For simplicity, just merge metadata at call time:
        return adapt({ ...(base ?? {}), ...(meta ?? {}) });
      },
      error(message: string, meta?: Record<string, unknown> | Error) {
        if (meta instanceof Error) {
          winstonLogger.error(message, { ...(base ?? {}), error: meta });
        } else {
          winstonLogger.error(message, { ...(base ?? {}), ...(meta ?? {}) });
        }
      },
      warn(message: string, meta?: Record<string, unknown> | Error) {
        if (meta instanceof Error) {
          winstonLogger.warn(message, { ...(base ?? {}), error: meta });
        } else {
          winstonLogger.warn(message, { ...(base ?? {}), ...(meta ?? {}) });
        }
      },
      info(message: string, meta?: Record<string, unknown> | Error) {
        if (meta instanceof Error) {
          winstonLogger.info(message, { ...(base ?? {}), error: meta });
        } else {
          winstonLogger.info(message, { ...(base ?? {}), ...(meta ?? {}) });
        }
      },
      debug(message: string, meta?: Record<string, unknown> | Error) {
        if (meta instanceof Error) {
          winstonLogger.debug(message, { ...(base ?? {}), error: meta });
        } else {
          winstonLogger.debug(message, { ...(base ?? {}), ...(meta ?? {}) });
        }
      },
      // Backstage sometimes calls trace; map it to debug
      // 'trace' method removed because it's not part of LoggerService interface.
    });

    return adapt();
  },
});
