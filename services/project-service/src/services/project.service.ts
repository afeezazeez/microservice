import { ProjectRepository } from '../repositories/project.repository';
import { ProjectMemberRepository } from '../repositories/project-member.repository';
import { CreateProjectDto } from '../dtos/project/create-project.dto';
import { UpdateProjectDto } from '../dtos/project/update-project.dto';
import { AddMemberDto } from '../dtos/project/add-member.dto';
import { ClientErrorException } from '../exceptions/client.error.exception';
import { ResponseStatus } from '../enums/http-status-codes';
import { ProjectStatus } from '../enums/project-status.enum';
import Project from '../database/models/Project';
import ProjectMember from '../database/models/ProjectMember';
import { PaginationOptions, PaginationMeta } from '../interfaces/pagination.interface';
import { generatePaginationMeta } from '../utils/helper';
import { WinstonLogger } from '../utils/logger/winston.logger';
import { FindOptions, Op } from 'sequelize';
import { RabbitMQService } from './rabbitmq.service';

export class ProjectService {
  private readonly projectRepository: ProjectRepository;
  private readonly projectMemberRepository: ProjectMemberRepository;
    private readonly logger: WinstonLogger;
    private readonly rabbitMQService: RabbitMQService;

    constructor(logger?: WinstonLogger) {
    this.projectRepository = new ProjectRepository();
    this.projectMemberRepository = new ProjectMemberRepository();
        this.logger = logger || new WinstonLogger('ProjectService');
        this.rabbitMQService = new RabbitMQService(logger);
  }

  async createProject(
    dto: CreateProjectDto,
    userId: number,
    companyId: number,
    correlationId?: string
    ): Promise<Project> {
    const slug = this.generateSlug(dto.name, companyId);

        const existingProject = await this.projectRepository.findOne({
            where: { slug }
        });

    if (existingProject) {
      throw new ClientErrorException('A project with this name already exists', ResponseStatus.CONFLICT);
    }

    const project = await this.projectRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
      company_id: companyId,
      created_by: userId,
      status: ProjectStatus.ACTIVE,
      start_date: dto.start_date ? new Date(dto.start_date) : undefined,
      end_date: dto.end_date ? new Date(dto.end_date) : undefined,
    });

        // Add creator as project member
    await this.projectMemberRepository.create({
      project_id: project.id,
      user_id: userId,
      joined_at: new Date(),
    });

        this.logger.info('Project created', { projectId: project.id, correlation_id: correlationId });

        return project;
  }

    async fetchCompanyProjects(
    companyId: number,
    userId: number,
        findOptions: FindOptions,
        paginationOptions: PaginationOptions,
        userRoles?: string[]
    ): Promise<{ data: Project[]; meta: PaginationMeta }> {
        const isSuperAdminOrProjectManager = userRoles?.some(role => role === 'super-admin' || role === 'project-manager');

        if (isSuperAdminOrProjectManager) {
            findOptions.where = {
                ...findOptions.where as object,
                company_id: companyId
            };
        } else {
            const userProjects = await this.projectMemberRepository.findAllWithoutPagination({
                where: { user_id: userId },
                attributes: ['project_id']
            });

            const projectIds = userProjects.map(pm => pm.project_id);

            findOptions.where = {
                ...findOptions.where as object,
                company_id: companyId,
                id: { [Op.in]: projectIds.length > 0 ? projectIds : [0] }
            };
        }

        const { page = 1, limit = 25 } = paginationOptions;

        const { rows, count } = await this.projectRepository.findAll(findOptions, paginationOptions);

        const meta = generatePaginationMeta(count, page, limit);

    return {
            data: rows,
            meta
    };
  }

    async fetchProject(projectId: number, companyId: number, userId: number): Promise<Project> {
        const project = await this.projectRepository.findById(projectId, {
            include: [{ model: ProjectMember, as: 'members' }]
        });

    if (!project) {
      throw new ClientErrorException('Project not found', ResponseStatus.NOT_FOUND);
    }

    if (project.company_id !== companyId) {
      throw new ClientErrorException('Project not found', ResponseStatus.NOT_FOUND);
    }

        return project;
  }

  async updateProject(
    projectId: number,
    dto: UpdateProjectDto,
    companyId: number,
    userId: number,
    correlationId?: string
  ): Promise<Project> {
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.company_id !== companyId) {
      throw new ClientErrorException('Project not found', ResponseStatus.NOT_FOUND);
    }

    const updateData: Partial<Project> = {};

        if (dto.name && dto.name !== project.name) {
      const newSlug = this.generateSlug(dto.name, companyId);
            const existing = await this.projectRepository.findOne({
                where: {
                    slug: newSlug,
                    id: { [Op.ne]: projectId }
                }
            });

            if (existing) {
        throw new ClientErrorException('A project with this name already exists', ResponseStatus.CONFLICT);
      }
      updateData.name = dto.name;
      updateData.slug = newSlug;
    }

    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status) updateData.status = dto.status;
    if (dto.start_date) updateData.start_date = new Date(dto.start_date);
    if (dto.end_date) updateData.end_date = new Date(dto.end_date);

    await this.projectRepository.update(projectId, updateData);

        this.logger.info('Project updated', { projectId, correlation_id: correlationId });

    const updated = await this.projectRepository.findById(projectId);
        if (!updated) {
            throw new ClientErrorException('Failed to retrieve updated project', ResponseStatus.INTERNAL_SERVER);
        }
        return updated;
  }

  async deleteProject(
    projectId: number,
    companyId: number,
    userId: number,
    companyName?: string
  ): Promise<void> {
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.company_id !== companyId) {
      throw new ClientErrorException('Project not found', ResponseStatus.NOT_FOUND);
    }

        const members = await this.projectMemberRepository.findAllWithoutPagination({
            where: { project_id: projectId }
        });

    for (const member of members) {
      await this.projectMemberRepository.hardDelete(member.id);
    }

        await this.projectRepository.hardDelete(projectId);

  }

  async addMember(
    projectId: number,
    dto: AddMemberDto,
    companyId: number,
    userId: number,
    companyName?: string,
    userName?: string,
    userEmail?: string
    ): Promise<ProjectMember> {
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.company_id !== companyId) {
      throw new ClientErrorException('Project not found', ResponseStatus.NOT_FOUND);
    }

    const existingMember = await this.projectMemberRepository.findOne({
        where: { project_id: projectId, user_id: dto.user_id }
    });

    if (existingMember) {
      throw new ClientErrorException('User is already a member of this project', ResponseStatus.CONFLICT);
    }

    const member = await this.projectMemberRepository.create({
      project_id: projectId,
      user_id: dto.user_id,
      joined_at: new Date(),
    });

    if (userName && userEmail) {
      await this.rabbitMQService.publish('project.events', 'project.member.added', {
        event: 'project.member.added',
        data: {
          project_id: projectId,
          project_name: project.name,
          user_id: dto.user_id,
          user_name: userName,
          user_email: userEmail,
          company_id: companyId,
          company_name: companyName || null,
          added_at: new Date().toISOString(),
        },
      });
    }

        return member;
  }

  async removeMember(
    projectId: number,
    memberUserId: number,
    companyId: number,
    userId: number,
    companyName?: string,
    userName?: string,
    userEmail?: string
  ): Promise<void> {
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.company_id !== companyId) {
      throw new ClientErrorException('Project not found', ResponseStatus.NOT_FOUND);
    }

        const member = await this.projectMemberRepository.findOne({
            where: { project_id: projectId, user_id: memberUserId }
        });

    if (!member) {
      throw new ClientErrorException('Member not found in project', ResponseStatus.NOT_FOUND);
    }

        // Cannot remove project creator
        if (project.created_by === memberUserId) {
            throw new ClientErrorException('Cannot remove the project creator', ResponseStatus.BAD_REQUEST);
    }

        await this.projectMemberRepository.hardDelete(member.id);

    if (userName && userEmail) {
      await this.rabbitMQService.publish('project.events', 'project.member.removed', {
        event: 'project.member.removed',
        data: {
          project_id: projectId,
          project_name: project.name,
          user_id: memberUserId,
          user_name: userName,
          user_email: userEmail,
          company_id: companyId,
          company_name: companyName || null,
          removed_at: new Date().toISOString(),
        },
      });
    }
  }

  private generateSlug(name: string, companyId: number): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${base}-${companyId}`;
  }
}
