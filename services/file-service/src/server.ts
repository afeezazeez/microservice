import 'reflect-metadata';
import app from './app';
import { initializeDatabase } from './config/database/database.config';
import configService from './utils/config/config.service';
import { WinstonLogger } from './utils/logger/winston.logger';
import { RabbitMQService } from './services/rabbitmq.service';

const Logger = new WinstonLogger('Server');
const PORT = configService.port;

let rabbitmqService: RabbitMQService | null = null;

async function bootstrap() {
  try {
    await initializeDatabase();

    rabbitmqService = new RabbitMQService();
    await rabbitmqService.connect();

    app.listen(PORT, () => {
      Logger.info(`File Service running on port ${PORT}`);
    });
  } catch (error: any) {
    Logger.error('Failed to start File Service', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  if (rabbitmqService) {
    await rabbitmqService.disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  Logger.info('SIGINT received, shutting down gracefully');
  if (rabbitmqService) {
    await rabbitmqService.disconnect();
  }
  process.exit(0);
});

bootstrap();

