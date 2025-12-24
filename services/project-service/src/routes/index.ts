import { Router, Request, Response } from 'express';
import projectRoutes from './project.routes';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'project-service', timestamp: new Date().toISOString() });
});

router.use('/projects', projectRoutes);

export default router;


