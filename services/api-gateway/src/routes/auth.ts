import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { login, refresh } from '../proxy/iamProxy.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const iamResponse = await login(req.body, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const data = (error as any)?.data ?? { success: false, error: 'Login failed' };
    return res.status(status).json(data);
  }
});

router.get('/me', authMiddleware, (req, res) => {
  return res.json({ success: true, data: (req as any).user });
});

router.post('/refresh', async (req, res) => {
  try {
    const iamResponse = await refresh(req.body, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const data = (error as any)?.data ?? { success: false, error: 'Token refresh failed' };
    return res.status(status).json(data);
  }
});

export { router as authRouter };

