import {
    transports,
    Logger,
    createLogger,
    LoggerOptions,
    format,
} from 'winston';
const { combine, timestamp, label, prettyPrint } = format;
import configService from '../config/config.service';
import { ILogger } from '../../interfaces/logger.interface';
import DailyRotateFile from 'winston-daily-rotate-file';

export class WinstonLogger implements ILogger {
    private readonly logConfig?: LoggerOptions;
    public logger: Logger | null = null;
    private readonly logChannel: string;
    private readonly logSource: string;

    constructor(scope: string) {
        this.logChannel = configService.get('LOG_CHANNEL') || 'daily';
        this.logSource = configService.get('LOG_SOURCE') || 'file';

        if (this.logSource === 'file') {
            const filePath = configService.get('LOG_FILE_PATH') || 'logs/app.log';
            const transportsList = [];

            if (this.logChannel === 'daily') {
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

            // Also log to console in development
            if (configService.get('NODE_ENV') !== 'production') {
                transportsList.push(new transports.Console({
                    format: format.combine(
                        format.colorize(),
                        format.simple()
                    )
                }));
            }

            this.logConfig = {
                transports: transportsList,
                format: combine(label({ label: scope }), timestamp(), prettyPrint()),
            };

            this.logger = createLogger(this.logConfig);
        }
    }

    log(level: 'info' | 'error' | 'debug' | 'warn', message: string, meta?: object): void {
        if (this.logSource === 'file' && this.logger) {
            this.logger[level](message, meta);
        }
    }

    debug(message: string, meta?: object): void {
        this.log('debug', message, meta);
    }

    error(message: string, meta?: object): void {
        this.log('error', message, meta);
    }

    info(message: string, meta?: object): void {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: object): void {
        this.log('warn', message, meta);
    }
}

// Export a default logger instance
const Logger = new WinstonLogger('App');
export default Logger;

