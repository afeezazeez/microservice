import {
    transports,
    Logger as WinstonLoggerType,
    createLogger,
    format,
} from 'winston';
import configService from '../config/config.service';
import { ILogger } from '../../interfaces/logger.interface';
import DailyRotateFile from 'winston-daily-rotate-file';

// Custom JSON format to match IAM's log structure for Grafana/Loki
const jsonFormat = format.combine(
    format.timestamp(),
    format.printf(({ level, message, timestamp, ...meta }) => {
        return JSON.stringify({
            level,
            message,
            context: {
                timestamp,
                ...meta
            }
        });
    })
);

export class WinstonLogger implements ILogger {
    public logger: WinstonLoggerType;
    private readonly scope: string;

    constructor(scope: string) {
        this.scope = scope;
        const transportsList: any[] = [];

        const logChannel = configService.get('LOG_CHANNEL') || 'daily';
        const filePath = configService.get('LOG_FILE_PATH') || 'logs/app.log';

        if (logChannel === 'daily') {
            transportsList.push(
                new DailyRotateFile({
                    filename: `${filePath}-%DATE%.log`,
                    datePattern: 'YYYY-MM-DD',
                    maxFiles: '14d',
                })
            );
        } else {
            transportsList.push(new transports.File({ filename: filePath }));
        }

        // Log to stderr with JSON format for Docker/Loki to pick up
        transportsList.push(new transports.Console({
            stderrLevels: ['error', 'warn', 'info', 'debug'],
            format: jsonFormat
        }));

        this.logger = createLogger({
            transports: transportsList,
            format: jsonFormat,
            defaultMeta: { scope: this.scope }
        });
    }

    info(message: string, meta?: object): void {
        this.logger.info(message, meta);
    }

    error(message: string, meta?: object): void {
        this.logger.error(message, meta);
    }

    warn(message: string, meta?: object): void {
        this.logger.warn(message, meta);
    }

    debug(message: string, meta?: object): void {
        this.logger.debug(message, meta);
    }
}

// Export a default logger instance
const Logger = new WinstonLogger('App');
export default Logger;
