import { Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { sendSuccessResponse } from '../utils/http/response-handlers';
import { ResponseStatus } from '../enums/http-status-codes';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CreateProjectDto } from '../dtos/project/create-project.dto';
import { UpdateProjectDto } from '../dtos/project/update-project.dto';
import { AddMemberDto } from '../dtos/project/add-member.dto';
import ProjectResponseDto, { ProjectMemberDto } from '../dtos/project/project-response.dto';
import { extractPaginationAndSorting } from '../utils/helper';
import { FindOptions, Op } from 'sequelize';

export class ProjectController {
  private readonly projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  createProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dto: CreateProjectDto = req.body;
      const user = req.user!;

      const project = await this.projectService.createProject(
        dto,
        user.id,
        user.company_id,
        req.correlationId
      );

            return sendSuccessResponse(res, ProjectResponseDto.make(project), 'Project created successfully', ResponseStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
            const search = req.query.q as string;
            const sortDirection = req.query.sortDirection || 'desc';
            const sortBy = req.query.sortBy || 'created_at';

            const findOptions: FindOptions = {
                where: {}
            };

            if (search) {
                findOptions.where = {
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { description: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            if (sortBy && sortDirection) {
                findOptions.order = [[sortBy as string, (sortDirection as string).toUpperCase()]];
            }

            const paginationOptions = extractPaginationAndSorting(req);
            const result = await this.projectService.fetchCompanyProjects(
                user.company_id,
                user.id,
                findOptions,
                paginationOptions
            );

            return sendSuccessResponse(res, {
                data: ProjectResponseDto.collection(result.data),
                meta: result.meta
            }, 'Projects retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = parseInt(req.params.id);
      const user = req.user!;

            const project = await this.projectService.fetchProject(projectId, user.company_id, user.id);

            return sendSuccessResponse(res, ProjectResponseDto.make(project), 'Project retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = parseInt(req.params.id);
      const dto: UpdateProjectDto = req.body;
      const user = req.user!;

      const project = await this.projectService.updateProject(
        projectId,
        dto,
        user.company_id,
        user.id,
        req.correlationId
      );

            return sendSuccessResponse(res, ProjectResponseDto.make(project), 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = parseInt(req.params.id);
      const user = req.user!;

      await this.projectService.deleteProject(projectId, user.company_id, user.id, req.correlationId);

            return sendSuccessResponse(res, [], 'Project deleted successfully', ResponseStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  addMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = parseInt(req.params.id);
      const dto: AddMemberDto = req.body;
      const user = req.user!;

      const member = await this.projectService.addMember(
        projectId,
        dto,
        user.company_id,
        user.id,
        req.correlationId
      );

            return sendSuccessResponse(res, ProjectMemberDto.make(member), 'Member added successfully', ResponseStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      const user = req.user!;

      await this.projectService.removeMember(projectId, userId, user.company_id, user.id, req.correlationId);

            return sendSuccessResponse(res, [], 'Member removed successfully');
    } catch (error) {
      next(error);
    }
  };
}
