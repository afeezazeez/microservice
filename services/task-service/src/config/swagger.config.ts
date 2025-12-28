import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Task Service API',
    version: '1.0.0',
    description: 'Task Management Service API Documentation',
  },
  servers: [
    {
      url: 'https://task-service.afeez-dev.local/api',
      description: 'Task Service API Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/dtos/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

