import { Sequelize } from 'sequelize-typescript';
import configService from '../../utils/config/config.service';
import { WinstonLogger } from '../../utils/logger/winston.logger';
import Project from '../../database/models/Project';
import ProjectMember from '../../database/models/ProjectMember';

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
    models: [Project, ProjectMember],
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
