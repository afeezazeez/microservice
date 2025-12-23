import pino from 'pino';
import { config } from './config';

export const logger = pino({
  level: config.logLevel,
  base: undefined, // reduce noise
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

