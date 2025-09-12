import winston from 'winston';
import ecsFormat from '@elastic/ecs-winston-format';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: ecsFormat(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.Http({
      host: process.env.LOGSTASH_HOST || 'localhost',
      port: Number(process.env.LOGSTASH_PORT || 5044),
      path: '/',
      ssl: false,
      headers: { 'content-type': 'application/json' },
    }),
  ],
});

export const log = {
  info: (msg: string, meta?: Record<string, unknown>) => logger.info(msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    logger.error(msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) =>
    logger.debug(msg, meta),
};
