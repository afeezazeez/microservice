import express, { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';
import { logger } from './utils/logger';
import { RabbitMQService } from './services/rabbitmq.service';
import { initializeDatabase } from './config/database.config';
import { notificationsRouter } from './routes/notifications';
import { errorHandler } from './middlewares/error.handler';
import { ClientErrorException } from './exceptions/client.error.exception';
import { ResponseStatus } from './enums/http-status-codes';

const app = express();

app.use(express.json());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Notification Service API Documentation',
}));

let rabbitmqService: RabbitMQService | null = null;

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/notifications', notificationsRouter);

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new ClientErrorException('Route not found', ResponseStatus.NOT_FOUND));
});

app.use(errorHandler);

export async function initializeServices(): Promise<void> {
  try {
    await initializeDatabase();
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

