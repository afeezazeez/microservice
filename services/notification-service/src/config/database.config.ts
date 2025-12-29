import { Sequelize } from 'sequelize-typescript';
import { config } from './index';
import { logger } from '../utils/logger';
import User from '../database/models/User';
import Notification from '../database/models/Notification';

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'notification_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  logging: config.nodeEnv === 'development' ? (msg: string) => logger.debug(msg) : false,
  models: [User, Notification],
  define: {
    underscored: true,
    timestamps: true,
  },
});

export async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (error: any) {
    logger.error(`Unable to connect to database: ${error.message}`);
    throw error;
  }
}

export default sequelize;

