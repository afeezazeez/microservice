import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/request-validator';
import { CreateProjectDto } from '../dtos/project/create-project.dto';
import { UpdateProjectDto } from '../dtos/project/update-project.dto';
import { AddMemberDto } from '../dtos/project/add-member.dto';

const router = Router();
const projectController = new ProjectController();

router.use(authMiddleware);

router.post('/', validateBody(CreateProjectDto), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', validateBody(UpdateProjectDto), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

router.post('/:id/members', validateBody(AddMemberDto), projectController.addMember);
router.delete('/:id/members/:userId', projectController.removeMember);

export default router;
