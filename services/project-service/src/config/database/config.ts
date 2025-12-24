import { config } from 'dotenv';

config();

const commonConfig = {
    dialect: 'mysql' as const,
    port: Number(process.env.DB_PORT) || 3306,
    migrationStorageTableName: 'sequelize_migrations',
    pool: {
        max: 30,
        min: 0,
        acquire: 30000,
        idle: 5000
    }
};

export const development = {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'project_db',
    host: process.env.DB_HOST || 'localhost',
    ...commonConfig
};

export const test = {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'project_db',
    host: process.env.DB_HOST || 'localhost',
    ...commonConfig
};

export const production = {
    username: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    host: process.env.DB_HOST || '',
    ...commonConfig
};

