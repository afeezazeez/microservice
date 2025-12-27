import express from 'express';
import { logger } from './utils/logger';
import { RabbitMQService } from './services/rabbitmq.service';

const app = express();

app.use(express.json());

let rabbitmqService: RabbitMQService | null = null;

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  });
});

export async function initializeServices(): Promise<void> {
  try {
    rabbitmqService = new RabbitMQService();
    await rabbitmqService.connect();

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error(`Failed to initialize services: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function shutdownServices(): Promise<void> {
  try {
    if (rabbitmqService) {
      await rabbitmqService.disconnect();
    }
    logger.info('Services shut down successfully');
  } catch (error) {
    logger.error(`Error shutting down services: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export { app };

