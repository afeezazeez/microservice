import * as amqplib from 'amqplib';
import { config } from '../config';
import { logger } from '../utils/logger';
import { NotificationEvent } from '../types/events';
import { EventHandlerFactory } from '../handlers/event-handler-factory';
import { ExchangeConfig, QueueConfig } from '../interfaces/rabbitmq-config.interface';

export class RabbitMQService {
  private connection: amqplib.Connection | null = null;
  private channel: amqplib.Channel | null = null;

  async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(config.rabbitmq.url) as any as amqplib.Connection;
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }
      this.channel = await (this.connection as any).createChannel();

      await this.setupExchanges();
      await this.setupQueues();
      await this.startConsumers();

      logger.info('RabbitMQ service connected and ready');
    } catch (error) {
      logger.error(`Failed to connect to RabbitMQ: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async setupExchanges(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    for (const exchange of config.rabbitmq.exchanges) {
      await this.channel.assertExchange(exchange.name, exchange.type, { durable: exchange.durable });
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    for (const queue of config.rabbitmq.queues) {
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

    for (const queue of config.rabbitmq.queues) {
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
        const content = JSON.parse(msg.content.toString());
        await this.handleMessage(content);
        this.channel?.ack(msg);
      } catch (error) {
        logger.error(`Error processing message from queue ${queueName}: ${error instanceof Error ? error.message : String(error)}`);
        this.channel?.nack(msg, false, false);
      }
    }, {
      noAck: false,
    });
  }

  private async handleMessage(event: NotificationEvent): Promise<void> {
    const handler = EventHandlerFactory.getHandler(event.event);

    if (!handler) {
      return;
    }

    await handler.handle(event);
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
      logger.error(`Error disconnecting from RabbitMQ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
