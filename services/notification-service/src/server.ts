import { app, initializeServices, shutdownServices } from './app';
import { config } from './config';
import { logger } from './utils/logger';

async function startServer() {
  try {
    await initializeServices();

    const server = app.listen(config.port, () => {
      logger.info(`Notification service listening on port ${config.port}`);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await shutdownServices();
      server.close(() => {
        logger.info('Notification service closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await shutdownServices();
      server.close(() => {
        logger.info('Notification service closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

startServer();

