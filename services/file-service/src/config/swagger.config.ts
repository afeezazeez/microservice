import swaggerJsdoc from 'swagger-jsdoc';
import configService from '../utils/config/config.service';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'File Service API',
      version: '1.0.0',
      description: 'File Service API Documentation',
    },
    servers: [
      {
        url: `http://localhost:${configService.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

