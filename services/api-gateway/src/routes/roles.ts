import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { listRoles } from '../proxy/iamProxy';
import { sendErrorResponse } from '../utils/response';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const iamResponse = await listRoles(token, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const errorData = (error as any)?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch roles', null, [], [], status);
  }
});

export { router as rolesRouter };

