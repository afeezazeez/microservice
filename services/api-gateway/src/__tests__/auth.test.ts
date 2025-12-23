import request from 'supertest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { app } from '../app';
import * as iamProxy from '../proxy/iamProxy';

vi.mock('../proxy/iamProxy');


const mockedIam = vi.mocked(iamProxy);

describe('Auth routes proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('proxies /auth/login and returns upstream response', async () => {
    mockedIam.login = vi.fn().mockResolvedValue({
      status: 200,
      data: { success: true, token: 'abc' },
    } as any);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'pass' })
      .expect(200);

    expect(res.body.token).toBe('abc');
    expect(mockedIam.login).toHaveBeenCalled();
  });

  it('proxies /auth/refresh and returns upstream response', async () => {
    mockedIam.refresh = vi.fn().mockResolvedValue({
      status: 200,
      data: { success: true, token: 'new' },
    } as any);

    const res = await request(app)
      .post('/auth/refresh')
      .send({ token: 'old' })
      .expect(200);

    expect(res.body.token).toBe('new');
    expect(mockedIam.refresh).toHaveBeenCalled();
  });

  it('proxies /auth/register and returns upstream response', async () => {
    mockedIam.register = vi.fn().mockResolvedValue({
      status: 200,
      data: { success: true, company: { id: 1 }, user: { id: 2 } },
    } as any);

    const res = await request(app)
      .post('/auth/register')
      .send({ company: { name: 'Acme' }, user: { email: 'a@b.com' } })
      .expect(200);

    expect(res.body.company.id).toBe(1);
    expect(mockedIam.register).toHaveBeenCalled();
  });

  it('requires auth on /auth/me', async () => {
    const res = await request(app).get('/auth/me').expect(401);
    expect(res.body.success).toBe(false);
  });

  it('returns user on /auth/me when token is valid', async () => {
    mockedIam.getAuthenticatedUser = vi.fn().mockResolvedValue({ id: 10, email: 'ok@test.com' } as any);

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer token123')
      .expect(200);

    expect(res.body.data.id).toBe(10);
    expect(mockedIam.getAuthenticatedUser).toHaveBeenCalled();
  });
});

