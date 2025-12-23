import { app } from './app';
import { config } from './config';
import { logger } from './logger';

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, 'API Gateway listening');
});

process.on('SIGTERM', () => {
  server.close(() => logger.info('API Gateway closed'));
});

process.on('SIGINT', () => {
  server.close(() => logger.info('API Gateway closed'));
});

