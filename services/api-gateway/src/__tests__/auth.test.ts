import request from 'supertest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { app } from '../app';
import { config } from '../config';
import * as iamProxy from '../proxy/iamProxy';

vi.mock('../proxy/iamProxy');

const mockedIam = vi.mocked(iamProxy);

// Helper to generate valid test JWT
function generateTestToken(payload: object = {}) {
  const defaultPayload = {
    id: 10,
    email: 'test@example.com',
    name: 'Test User',
    company_id: 1,
    company_name: 'Test Company',
    roles: ['admin'],
    permissions: ['project:create', 'project:view'],
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
  };
  return jwt.sign({ ...defaultPayload, ...payload }, config.jwtSecret);
}

describe('Auth routes proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('proxies request and returns upstream response', async () => {
      mockedIam.login = vi.fn().mockResolvedValue({
        status: 200,
        data: { success: true, data: { user: { id: 1 }, access_token: 'abc', refresh_token: 'xyz' } },
      } as any);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'pass' })
        .expect(200);

      expect(res.body.data.access_token).toBe('abc');
      expect(res.body.data.refresh_token).toBe('xyz');
      expect(mockedIam.login).toHaveBeenCalled();
    });

    it('returns error when login fails', async () => {
      mockedIam.login = vi.fn().mockRejectedValue({
        status: 400,
        data: { success: false, error: 'Invalid credentials' },
      } as any);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'wrong' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    it('proxies request and returns new access token', async () => {
      mockedIam.refresh = vi.fn().mockResolvedValue({
        status: 200,
        data: { success: true, data: { access_token: 'new-access-token' } },
      } as any);

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refresh_token: 'old-refresh-token' })
        .expect(200);

      expect(res.body.data.access_token).toBe('new-access-token');
      expect(mockedIam.refresh).toHaveBeenCalled();
    });

    it('returns error when refresh fails', async () => {
      mockedIam.refresh = vi.fn().mockRejectedValue({
        status: 400,
        data: { success: false, error: 'Invalid or expired refresh token' },
      } as any);

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/register', () => {
    it('proxies request and returns company/user data', async () => {
      mockedIam.register = vi.fn().mockResolvedValue({
        status: 200,
        data: { success: true, data: { company: { id: 1 }, user: { id: 2 }, access_token: 'xyz', refresh_token: 'abc' } },
      } as any);

      const res = await request(app)
        .post('/auth/register')
        .send({ company: { name: 'Acme', email: 'acme@test.com' }, user: { email: 'a@b.com', name: 'John', password: 'pass123', password_confirmation: 'pass123' } })
        .expect(200);

      expect(res.body.data.company.id).toBe(1);
      expect(mockedIam.register).toHaveBeenCalled();
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 when no token provided', async () => {
      const res = await request(app).get('/auth/me').expect(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid token');
    });

    it('returns 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: 1, email: 'test@test.com', exp: Math.floor(Date.now() / 1000) - 3600 },
        config.jwtSecret
      );

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Token expired');
    });

    it('returns user data when token is valid', async () => {
      const token = generateTestToken({
        id: 10,
        email: 'ok@test.com',
        name: 'Test User',
        company_id: 5,
        company_name: 'Acme Corp',
        roles: ['super-admin'],
        permissions: ['project:create', 'project:view'],
        type: 'access',
      });

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(10);
      expect(res.body.data.user.email).toBe('ok@test.com');
      expect(res.body.data.user.name).toBe('Test User');
      expect(res.body.data.user.company_id).toBe(5);
      expect(res.body.data.user.company_name).toBe('Acme Corp');
      expect(res.body.data.user.roles).toContain('super-admin');
    });
  });
});

