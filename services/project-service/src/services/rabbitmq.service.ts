import * as amqplib from 'amqplib';
import configService from '../utils/config/config.service';
import { WinstonLogger } from '../utils/logger/winston.logger';

export class RabbitMQService {
  private connection: amqplib.Connection | null = null;
  private channel: amqplib.Channel | null = null;
  private logger: WinstonLogger;

  constructor(logger?: WinstonLogger) {
    this.logger = logger || new WinstonLogger('RabbitMQService');
  }

  private async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    try {
      const rabbitmqUrl = configService.get('RABBITMQ_URL', 'amqp://admin:admin123@rabbitmq:5672');
      this.connection = await amqplib.connect(rabbitmqUrl) as any as amqplib.Connection;
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }
      this.channel = await (this.connection as any).createChannel();
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async publish(exchange: string, routingKey: string, message: object): Promise<void> {
    try {
      await this.connect();
      if (!this.channel) {
        throw new Error('Channel not initialized');
      }

      await this.channel.assertExchange(exchange, 'topic', { durable: true });

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const published = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        { persistent: true }
      );

      if (!published) {
        this.logger.warn(`Message not published to exchange ${exchange} with routing key ${routingKey}`);
      } else {
        this.logger.info(`Published message to ${exchange} with routing key ${routingKey}`);
      }
    } catch (error) {
      this.logger.error(`Failed to publish message to RabbitMQ: ${error instanceof Error ? error.message : String(error)}`, {
        exchange,
        routingKey,
      });
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }
    } catch (error) {
      this.logger.error(`Error disconnecting from RabbitMQ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

