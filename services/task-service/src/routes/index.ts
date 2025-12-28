import { Router, Request, Response } from 'express';
import taskRoutes from './task.routes';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'task-service', timestamp: new Date().toISOString() });
});

router.use('/tasks', taskRoutes);

export default router;

