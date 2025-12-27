import dotenv from 'dotenv';
import { ExchangeConfig, QueueConfig } from '../interfaces/rabbitmq-config.interface';

dotenv.config();

export const config: {
  port: number;
  nodeEnv: string;
  rabbitmq: {
    url: string;
    exchanges: ExchangeConfig[];
    queues: QueueConfig[];
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: {
      name: string;
      address: string;
    };
  };
  frontendUrl: string;
} = {
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin123@rabbitmq:5672',
    exchanges: [
      {
        name: 'user.events',
        type: 'topic',
        durable: true,
      },
    ],
    queues: [
      {
        name: 'user.invited',
        durable: true,
        bindings: [
          {
            exchange: 'user.events',
            routingKey: 'user.invited',
          },
        ],
      },
    ],
  },
  
  email: {
    host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.MAIL_PORT || '2525', 10),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USERNAME || '',
      pass: process.env.MAIL_PASSWORD || '',
    },
    from: {
      name: process.env.MAIL_FROM_NAME || 'TaskFlow',
      address: process.env.MAIL_FROM_ADDRESS || 'noreply@taskflow.com',
    },
  },
  
  frontendUrl: process.env.FRONTEND_URL || 'http://app.afeez-dev.local',
};

