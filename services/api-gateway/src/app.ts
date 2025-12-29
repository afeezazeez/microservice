import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import { correlationIdMiddleware } from './middleware/correlationId';
import { requestLoggerMiddleware } from './middleware/requestLogger';
import { corsMiddleware } from './middleware/cors';
import {
  generalRateLimiter,
  authRateLimiter,
  speedLimiter,
  requestTimeoutMiddleware,
  requestSizeLimiter,
} from './middleware/security';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { rolesRouter } from './routes/roles';
import { projectsRouter } from './routes/projects';
import { tasksRouter } from './routes/tasks';
import { filesRouter } from './routes/files';

const app = express();
const publicDir = path.join(__dirname, '../public');

if (config.trustProxy) {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

app.use(corsMiddleware);
app.use(requestTimeoutMiddleware);
app.use(requestSizeLimiter);
app.use(speedLimiter);
app.use(generalRateLimiter);
app.use(express.json({ limit: config.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }));
app.use(correlationIdMiddleware);
app.use(requestLoggerMiddleware);

app.use(express.static(publicDir));
app.get('/', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/files', filesRouter);

export { app };

