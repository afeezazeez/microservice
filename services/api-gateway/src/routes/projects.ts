import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { listProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember } from '../proxy/projectProxy';
import { sendErrorResponse } from '../utils/response';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const projectResponse = await listProjects(token, (req as any).correlationId);
    res.status(projectResponse.status).json(projectResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch projects broda', null, [], [], status);
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const id = parseInt(req.params.id);
    const projectResponse = await getProject(token, id, (req as any).correlationId);
    res.status(projectResponse.status).json(projectResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch project', null, [], [], status);
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const projectResponse = await createProject(token, req.body, (req as any).correlationId);
    res.status(projectResponse.status).json(projectResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to create project', null, [], [], status);
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const id = parseInt(req.params.id);
    const projectResponse = await updateProject(token, id, req.body, (req as any).correlationId);
    res.status(projectResponse.status).json(projectResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to update project', null, [], [], status);
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const id = parseInt(req.params.id);
    const projectResponse = await deleteProject(token, id, (req as any).correlationId);
    res.status(projectResponse.status).json(projectResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to delete project', null, [], [], status);
  }
});

router.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const projectId = parseInt(req.params.id);
    const projectResponse = await addMember(token, projectId, req.body, (req as any).correlationId);
    res.status(projectResponse.status).json(projectResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to add member', null, [], [], status);
  }
});

router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
  try {
    const token = (req as any).token;
    const projectId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const projectResponse = await removeMember(token, projectId, userId, (req as any).correlationId);
    res.status(projectResponse.status).json(projectResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to remove member', null, [], [], status);
  }
});

export { router as projectsRouter };
