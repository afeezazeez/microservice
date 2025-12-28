import { Sequelize } from 'sequelize-typescript';
import configService from '../../utils/config/config.service';
import { WinstonLogger } from '../../utils/logger/winston.logger';
import Task from '../../database/models/Task';
import TaskWatcher from '../../database/models/TaskWatcher';

const Logger = new WinstonLogger('Database');
const { host, port, name, user, password } = configService.database;

const sequelize = new Sequelize({
  dialect: 'mysql',
  host,
  port,
  database: name,
  username: user,
  password,
  logging: configService.isDevelopment ? (msg) => Logger.debug(msg) : false,
  models: [Task, TaskWatcher],
  define: {
    underscored: true,
    timestamps: true,
  },
});

export async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    Logger.info('Database connection established successfully');
  } catch (error: any) {
    Logger.error('Unable to connect to database', { error: error.message });
    throw error;
  }
}

export default sequelize;

