import * as amqplib from 'amqplib';
import { WinstonLogger } from '../utils/logger/winston.logger';
import { FileServiceEvent } from '../types/events';
import { EventHandlerFactory } from '../handlers/event-handler-factory';
import { rabbitmqConfig } from '../config/rabbitmq.config';

export class RabbitMQService {
  private connection: amqplib.Connection | null = null;
  private channel: amqplib.Channel | null = null;
  private logger: WinstonLogger;

  constructor(logger?: WinstonLogger) {
    this.logger = logger || new WinstonLogger('RabbitMQService');
  }

  async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    try {
      this.connection = await amqplib.connect(rabbitmqConfig.url) as any as amqplib.Connection;
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }
      this.channel = await (this.connection as any).createChannel();

      await this.setupExchanges();
      await this.setupQueues();
      await this.startConsumers();

      this.logger.info('RabbitMQ service connected and ready');
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async setupExchanges(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    for (const exchange of rabbitmqConfig.exchanges) {
      await this.channel.assertExchange(exchange.name, exchange.type, { durable: exchange.durable });
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    for (const queue of rabbitmqConfig.queues) {
      await this.channel.assertQueue(queue.name, { durable: queue.durable });

      for (const binding of queue.bindings) {
        await this.channel.bindQueue(queue.name, binding.exchange, binding.routingKey);
      }
    }
  }

  private async startConsumers(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    for (const queue of rabbitmqConfig.queues) {
      await this.consumeQueue(queue.name);
    }
  }

  private async consumeQueue(queueName: string): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.consume(queueName, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        const content = JSON.parse(msg.content.toString()) as FileServiceEvent;
        await this.handleMessage(content);
        this.channel?.ack(msg);
      } catch (error) {
        this.logger.error(`Error processing message from queue ${queueName}: ${error instanceof Error ? error.message : String(error)}`);
        this.channel?.nack(msg, false, false);
      }
    }, {
      noAck: false,
    });
  }

  private async handleMessage(event: FileServiceEvent): Promise<void> {
    const handler = EventHandlerFactory.getHandler(event.event);

    if (!handler) {
      this.logger.warn(`No handler found for event: ${event.event}`);
      return;
    }

    await handler(event);
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

