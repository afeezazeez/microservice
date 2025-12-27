import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../proxy/iamProxy';
import { sendErrorResponse } from '../utils/response';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const iamResponse = await listUsers(token, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const errorData = (error as any)?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch users', null, [], [], status);
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const id = parseInt(req.params.id);
    const iamResponse = await getUser(token, id, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const errorData = (error as any)?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch user', null, [], [], status);
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const iamResponse = await createUser(token, req.body, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const errorData = (error as any)?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to create user', null, [], [], status);
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const id = parseInt(req.params.id);
    const iamResponse = await updateUser(token, id, req.body, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const errorData = (error as any)?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to update user', null, [], [], status);
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const id = parseInt(req.params.id);
    const iamResponse = await deleteUser(token, id, (req as any).correlationId);
    res.status(iamResponse.status).json(iamResponse.data);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const errorData = (error as any)?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to delete user', null, [], [], status);
  }
});

export { router as usersRouter };

