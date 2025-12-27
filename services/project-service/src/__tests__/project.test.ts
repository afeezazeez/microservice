import request from 'supertest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { ProjectService } from '../services/project.service';
import Project from '../database/models/Project';
import ProjectMember from '../database/models/ProjectMember';

vi.mock('jsonwebtoken');
vi.mock('../config/database/database.config', () => ({
  default: {
    authenticate: vi.fn().mockResolvedValue(undefined),
    sync: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  },
  initializeDatabase: vi.fn().mockResolvedValue(undefined),
}));

const { mockProjectServiceInstance } = vi.hoisted(() => {
  const mockInstance = {
    createProject: vi.fn(),
    fetchCompanyProjects: vi.fn(),
    fetchProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
  };
  
  return { mockProjectServiceInstance: mockInstance };
});

vi.mock('../services/project.service', () => {
  return {
    ProjectService: vi.fn(() => mockProjectServiceInstance),
  };
});

const mockedJwt = vi.mocked(jwt);

// Import app after mocks are set up
import app from '../app';

// Mock user for authentication
const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  company_id: 1,
  company_name: 'Test Company',
  roles: ['user'],
  permissions: ['project:create', 'project:view', 'project:edit', 'project:delete'],
};

// Mock JWT payload
const mockJwtPayload = {
  id: mockUser.id,
  email: mockUser.email,
  name: mockUser.name,
  company_id: mockUser.company_id,
  company_name: mockUser.company_name,
  roles: mockUser.roles,
  permissions: mockUser.permissions,
  type: 'access',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 300,
};

// Helper to generate auth headers
function getAuthHeaders() {
  return {
    Authorization: 'Bearer valid-token',
    'x-correlation-id': 'test-correlation-id',
  };
}

// Helper to create mock project
function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    name: 'Test Project',
    slug: 'test-project',
    description: 'Test Description',
    company_id: 1,
    created_by: 1,
    status: 'active' as any,
    start_date: null,
    end_date: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Project;
}

// Helper to create mock project member
function createMockMember(overrides: Partial<ProjectMember> = {}): ProjectMember {
  return {
    id: 1,
    project_id: 1,
    user_id: 2,
    joined_at: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ProjectMember;
}

describe('Project API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock JWT verification to return our mock payload
    mockedJwt.verify = vi.fn().mockReturnValue(mockJwtPayload);
  });

  describe('POST /api/projects', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
      };

      const mockProject = createMockProject({
        name: projectData.name,
        description: projectData.description,
        company_id: mockUser.company_id,
      });

      mockProjectServiceInstance.createProject.mockResolvedValue(mockProject);

      const res = await request(app)
        .post('/api/projects')
        .set(getAuthHeaders())
        .send(projectData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(projectData.name);
      expect(res.body.data.company_id).toBe(mockUser.company_id);
      expect(mockProjectServiceInstance.createProject).toHaveBeenCalledWith(
        expect.objectContaining({ name: projectData.name }),
        mockUser.id,
        mockUser.company_id,
        'test-correlation-id'
      );
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set(getAuthHeaders())
        .send({ description: 'Test' })
        .expect(422);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/projects', () => {
    it('should get all projects', async () => {
      const mockProjects = [createMockProject()];
      mockProjectServiceInstance.fetchCompanyProjects.mockResolvedValue({
        data: mockProjects,
        meta: {
          current_page: 1,
          next_page: null,
          previous_page: null,
          per_page: 25,
          total: 1,
          last_page: 1,
        },
      });

      const res = await request(app)
        .get('/api/projects')
        .set(getAuthHeaders())
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.meta).toBeDefined();
    });

    it('should support pagination', async () => {
      mockProjectServiceInstance.fetchCompanyProjects.mockResolvedValue({
        data: [],
        meta: {
          current_page: 1,
          next_page: null,
          previous_page: null,
          per_page: 10,
          total: 0,
          last_page: 1,
        },
      });

      const res = await request(app)
        .get('/api/projects?page=1&perPage=10')
        .set(getAuthHeaders())
        .expect(200);

      expect(res.body.data.meta.current_page).toBe(1);
      expect(res.body.data.meta.per_page).toBe(10);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/projects')
        .expect(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should get a project by ID', async () => {
      const mockProject = createMockProject({ id: 1 });
      mockProjectServiceInstance.fetchProject.mockResolvedValue(mockProject);

      const res = await request(app)
        .get('/api/projects/1')
        .set(getAuthHeaders())
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(mockProjectServiceInstance.fetchProject).toHaveBeenCalledWith(1, mockUser.company_id, mockUser.id);
    });

    it('should return 404 when project not found', async () => {
      const { ClientErrorException } = await import('../exceptions/client.error.exception');
      const { ResponseStatus } = await import('../enums/http-status-codes');
      
      mockProjectServiceInstance.fetchProject.mockRejectedValue(
        new ClientErrorException('Project not found', ResponseStatus.NOT_FOUND)
      );

      const res = await request(app)
        .get('/api/projects/99999')
        .set(getAuthHeaders())
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update a project', async () => {
      const mockProject = createMockProject({ id: 1, name: 'Updated Name' });
      mockProjectServiceInstance.updateProject.mockResolvedValue(mockProject);

      const res = await request(app)
        .put('/api/projects/1')
        .set(getAuthHeaders())
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
      expect(mockProjectServiceInstance.updateProject).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Updated Name' }),
        mockUser.company_id,
        mockUser.id,
        'test-correlation-id'
      );
    });

    it('should return 404 when project not found', async () => {
      const { ClientErrorException } = await import('../exceptions/client.error.exception');
      const { ResponseStatus } = await import('../enums/http-status-codes');
      
      mockProjectServiceInstance.updateProject.mockRejectedValue(
        new ClientErrorException('Project not found', ResponseStatus.NOT_FOUND)
      );

      const res = await request(app)
        .put('/api/projects/99999')
        .set(getAuthHeaders())
        .send({ name: 'Updated' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project', async () => {
      mockProjectServiceInstance.deleteProject.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/projects/1')
        .set(getAuthHeaders())
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(mockProjectServiceInstance.deleteProject).toHaveBeenCalledWith(
        1,
        mockUser.company_id,
        mockUser.id,
        'test-correlation-id'
      );
    });

    it('should return 404 when project not found', async () => {
      const { ClientErrorException } = await import('../exceptions/client.error.exception');
      const { ResponseStatus } = await import('../enums/http-status-codes');
      
      const error = new ClientErrorException('Project not found', ResponseStatus.NOT_FOUND);
      mockProjectServiceInstance.deleteProject.mockRejectedValue(error);

      const res = await request(app)
        .delete('/api/projects/99999')
        .set(getAuthHeaders())
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(mockProjectServiceInstance.deleteProject).toHaveBeenCalledWith(
        99999,
        mockUser.company_id,
        mockUser.id,
        'test-correlation-id'
      );
    });
  });

  describe('POST /api/projects/:id/members', () => {
    it('should add a member to a project', async () => {
      const mockMember = createMockMember({ user_id: 2, project_id: 1 });
      mockProjectServiceInstance.addMember.mockResolvedValue(mockMember);

      const res = await request(app)
        .post('/api/projects/1/members')
        .set(getAuthHeaders())
        .send({ user_id: 2 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user_id).toBe(2);
      expect(mockProjectServiceInstance.addMember).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ user_id: 2 }),
        mockUser.company_id,
        mockUser.id,
        'test-correlation-id'
      );
    });

    it('should return 422 when user_id is missing', async () => {
      const res = await request(app)
        .post('/api/projects/1/members')
        .set(getAuthHeaders())
        .send({})
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(mockProjectServiceInstance.addMember).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/projects/:id/members/:userId', () => {
    it('should remove a member from a project', async () => {
      mockProjectServiceInstance.removeMember.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/projects/1/members/2')
        .set(getAuthHeaders())
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(mockProjectServiceInstance.removeMember).toHaveBeenCalledWith(
        1,
        2,
        mockUser.company_id,
        mockUser.id,
        'test-correlation-id'
      );
    });

    it('should return 404 when member not found', async () => {
      const { ClientErrorException } = await import('../exceptions/client.error.exception');
      const { ResponseStatus } = await import('../enums/http-status-codes');
      
      const error = new ClientErrorException('Member not found', ResponseStatus.NOT_FOUND);
      mockProjectServiceInstance.removeMember.mockRejectedValue(error);

      const res = await request(app)
        .delete('/api/projects/1/members/999')
        .set(getAuthHeaders())
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(mockProjectServiceInstance.removeMember).toHaveBeenCalledWith(
        1,
        999,
        mockUser.company_id,
        mockUser.id,
        'test-correlation-id'
      );
    });
  });
});

