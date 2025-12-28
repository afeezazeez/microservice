import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { listTasks, getTask, createTask, updateTask, deleteTask, startWatching, stopWatching, getWatchers } from '../proxy/taskProxy';
import { sendErrorResponse } from '../utils/response';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const taskResponse = await listTasks(token, (req as any).correlationId, req.query);
    res.status(taskResponse.status).json(taskResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch tasks', null, [], [], status);
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const id = parseInt(req.params.id);
    const taskResponse = await getTask(token, id, (req as any).correlationId);
    res.status(taskResponse.status).json(taskResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch task', null, [], [], status);
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const taskResponse = await createTask(token, req.body, (req as any).correlationId);
    res.status(taskResponse.status).json(taskResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to create task', null, [], [], status);
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const id = parseInt(req.params.id);
    const taskResponse = await updateTask(token, id, req.body, (req as any).correlationId);
    res.status(taskResponse.status).json(taskResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to update task', null, [], [], status);
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const id = parseInt(req.params.id);
    const taskResponse = await deleteTask(token, id, (req as any).correlationId);
    res.status(taskResponse.status).json(taskResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to delete task', null, [], [], status);
  }
});

router.post('/:id/watch', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const taskId = parseInt(req.params.id);
    const taskResponse = await startWatching(token, taskId, (req as any).correlationId);
    res.status(taskResponse.status).json(taskResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to start watching task', null, [], [], status);
  }
});

router.delete('/:id/watch', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const taskId = parseInt(req.params.id);
    const taskResponse = await stopWatching(token, taskId, (req as any).correlationId);
    res.status(taskResponse.status).json(taskResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to stop watching task', null, [], [], status);
  }
});

router.get('/:id/watchers', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const taskId = parseInt(req.params.id);
    const taskResponse = await getWatchers(token, taskId, (req as any).correlationId);
    res.status(taskResponse.status).json(taskResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch watchers', null, [], [], status);
  }
});

export { router as tasksRouter };

