import { app } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, 'API Gateway listening');
});

process.on('SIGTERM', () => {
  server.close(() => logger.info('API Gateway closed'));
});

process.on('SIGINT', () => {
  server.close(() => logger.info('API Gateway closed'));
});

