import 'reflect-metadata';
import app from './app';
import { initializeDatabase } from './config/database/database.config';
import configService from './utils/config/config.service';
import { WinstonLogger } from './utils/logger/winston.logger';

const Logger = new WinstonLogger('Server');
const PORT = configService.port;

async function bootstrap() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
            Logger.info(`Project Service running on port ${PORT}`);
    });
    } catch (error: any) {
        Logger.error('Failed to start Project Service', { error: error.message });
    process.exit(1);
  }
}

bootstrap();
