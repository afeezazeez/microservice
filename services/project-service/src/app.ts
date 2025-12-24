import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import indexRouter from './routes/index';
import { errorHandler } from './middlewares/error.handler';
import { correlationIdMiddleware } from './middlewares/correlation-id.middleware';
import { httpLogger } from './utils/logger/logger';
import { ClientErrorException } from './exceptions/client.error.exception';
import { ResponseStatus } from './enums/http-status-codes';

const app: Application = express();

app.disable('x-powered-by');

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
}));

app.use(helmet());
app.use(correlationIdMiddleware);
app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', indexRouter);

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new ClientErrorException('Route not found', ResponseStatus.NOT_FOUND));
});

app.use(errorHandler);

export default app;


