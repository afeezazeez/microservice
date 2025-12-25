import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { login, refresh, register } from '../proxy/iamProxy';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const iamResponse = await login(req.body, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const errorData = (error as any)?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Login failed', null, [], [], status);
  }
});

router.get('/me', authMiddleware, (req, res) => {
  sendSuccessResponse(res, { user: (req as any).user }, '');
});

router.post('/refresh', async (req, res) => {
  try {
    const iamResponse = await refresh(req.body, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const errorData = (error as any)?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Token refresh failed', null, [], [], status);
  }
});

router.post('/register', async (req, res) => {
  try {
    const iamResponse = await register(req.body, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const errorData = (error as any)?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Registration failed', null, [], [], status);
  }
});

export { router as authRouter };

