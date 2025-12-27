import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { correlationIdMiddleware } from './middleware/correlationId';
import { requestLoggerMiddleware } from './middleware/requestLogger';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { rolesRouter } from './routes/roles';

const app = express();
const publicDir = path.join(__dirname, '../public');

app.use(helmet());
app.use(express.json());
app.use(correlationIdMiddleware);
app.use(requestLoggerMiddleware);

app.use(express.static(publicDir));
app.get('/', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);

export { app };

