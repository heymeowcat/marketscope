import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { UserRepository } from '../../src/repositories/user-repository';
import { UserRole } from '../../src/domain/user';
import { Express } from 'express';

// [NFR-04] Integration tests for role-based access control
describe('Admin Role Protection - NFR-04', () => {
  let app: Express;
  let adminToken: string;
  let customerToken: string;
  let customerUserId: string;
  let userRepository: UserRepository;

  beforeEach(async () => {
    userRepository = new UserRepository();
    const auditLogRepository = new (await import('../../src/repositories/audit-log-repository')).AuditLogRepository();
    app = createApp({ userRepository, auditLogRepository });

    // Register admin user first as customer
    const adminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123!'
      });

    const adminUserId = adminResponse.body.user.id;

    // Manually set admin role
    await userRepository.updateRole(adminUserId, UserRole.ADMIN);

    // Get a new token to include the admin role
    // For testing, we'll manually create a JWT with admin role
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
    adminToken = jwt.sign(
      {
        userId: adminUserId,
        email: 'admin@example.com',
        role: UserRole.ADMIN
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Register customer user
    const customerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'customer@example.com',
        password: 'CustomerPassword123!'
      });

    customerToken = customerResponse.body.token;
    customerUserId = customerResponse.body.user.id;
  });

  // [NFR-04] Non-admin role update rejection
  it('[NFR-04] should reject role update from CUSTOMER with HTTP 403 Forbidden', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        role: UserRole.ADMIN
      })
      .expect(403);

    expect(response.body.error.code).toBe('ROLE_ACCESS_DENIED');
  });

  it('[NFR-04] should allow role update from ADMIN with HTTP 200', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: UserRole.SUSPENDED
      })
      .expect(200);

    expect(response.body.user.role).toBe(UserRole.SUSPENDED);
  });

  it('[NFR-04] should reject audit log retrieval from CUSTOMER', async () => {
    const response = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    expect(response.body.error.code).toBe('ROLE_ACCESS_DENIED');
  });

  it('[NFR-04] should allow audit log retrieval from ADMIN', async () => {
    await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('[NFR-04] should reject users list from CUSTOMER', async () => {
    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    expect(response.body.error.code).toBe('ROLE_ACCESS_DENIED');
  });

  it('[NFR-04] should allow users list from ADMIN', async () => {
    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.users).toBeDefined();
  });

  it('[NFR-04] should reject requests without authentication', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .send({
        role: UserRole.ADMIN
      })
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('[NFR-04] should not create audit log for rejected requests', async () => {
    const auditLogRepository = new (await import('../../src/repositories/audit-log-repository')).AuditLogRepository();
    await auditLogRepository.clear();

    // Attempt role update with customer token (should be rejected)
    await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        role: UserRole.ADMIN
      })
      .expect(403);

    const logs = await auditLogRepository.getAll();
    expect(logs).toHaveLength(0);
  });
});
