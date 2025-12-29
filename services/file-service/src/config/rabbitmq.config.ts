import dotenv from 'dotenv';
import { ExchangeConfig, QueueConfig } from '../interfaces/rabbitmq-config.interface';

dotenv.config();

export const rabbitmqConfig: {
  url: string;
  exchanges: ExchangeConfig[];
  queues: QueueConfig[];
} = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin123@rabbitmq:5672',
  exchanges: [
    {
      name: 'file.events',
      type: 'topic',
      durable: true,
    },
    {
      name: 'task.events',
      type: 'topic',
      durable: true,
    },
  ],
  queues: [
    {
      name: 'file-service.task.deleted',
      durable: true,
      bindings: [
        {
          exchange: 'task.events',
          routingKey: 'task.deleted',
        },
      ],
    },
  ],
};

