import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { UserRepository } from '../../src/repositories/user-repository';
import { AuditLogRepository } from '../../src/repositories/audit-log-repository';
import { UserRole, UserStatus } from '../../src/domain/user';
import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';

// [AC-02] Integration tests for admin role updates and audit logging
describe('User Role Update Endpoint - PATCH /api/v1/admin/users/:id/role', () => {
  let app: Express;
  let adminToken: string;
  let customerUserId: string;
  let userRepository: UserRepository;
  let auditLogRepository: AuditLogRepository;

  beforeEach(async () => {
    userRepository = new UserRepository();
    auditLogRepository = new AuditLogRepository();
    app = createApp({ userRepository, auditLogRepository });

    // Register admin user first as customer
    let adminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123!'
      });

    const adminUserId = adminResponse.body.user.id;

    // Manually set admin role in repository for testing
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

    customerUserId = customerResponse.body.user.id;
  });

  // [AC-02] Admin updates user role successfully
  it('[AC-02] should update user role from CUSTOMER to SUSPENDED', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: UserRole.SUSPENDED,
        reason: 'Compliance review'
      })
      .expect(200);

    expect(response.body.user.role).toBe(UserRole.SUSPENDED);
    expect(response.body.user.id).toBe(customerUserId);
  });

  // [AC-02] Audit log created with all required fields
  it('[AC-02] should create audit log entry with actor, timestamp, and reason', async () => {
    const beforeUpdate = new Date();

    await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: UserRole.SUSPENDED,
        reason: 'Compliance review'
      })
      .expect(200);

    const afterUpdate = new Date();

    const auditLogs = await auditLogRepository.getAll();
    expect(auditLogs).toHaveLength(1);

    const auditLog = auditLogs[0];
    expect(auditLog.auditId).toBeDefined();
    expect(auditLog.targetUserId).toBe(customerUserId);
    expect(auditLog.previousRole).toBe(UserRole.CUSTOMER);
    expect(auditLog.newRole).toBe(UserRole.SUSPENDED);
    expect(auditLog.reason).toBe('Compliance review');
    expect(auditLog.timestamp.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    expect(auditLog.timestamp.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
  });

  // [AC-02] Audit log timestamp in UTC ISO-8601 format
  it('[AC-02] should return audit log timestamp in UTC ISO-8601 format', async () => {
    await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: UserRole.SUSPENDED,
        reason: 'Test reason'
      })
      .expect(200);

    const logs = await auditLogRepository.getAll();
    const isoTimestamp = logs[0].timestamp.toISOString();

    expect(isoTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  // [AC-02] Role transitions
  it('[AC-02] should support role transition CUSTOMER -> ADMIN', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: UserRole.ADMIN,
        reason: 'Promotion'
      })
      .expect(200);

    expect(response.body.user.role).toBe(UserRole.ADMIN);
  });

  it('[AC-02] should support role transition SUSPENDED -> CUSTOMER', async () => {
    // First suspend the user
    await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: UserRole.SUSPENDED
      })
      .expect(200);

    // Then unsuspend
    const response = await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: UserRole.CUSTOMER,
        reason: 'Compliance check passed'
      })
      .expect(200);

    expect(response.body.user.role).toBe(UserRole.CUSTOMER);

    const logs = await auditLogRepository.getAll();
    expect(logs).toHaveLength(2);
    expect(logs[1].previousRole).toBe(UserRole.SUSPENDED);
    expect(logs[1].newRole).toBe(UserRole.CUSTOMER);
  });

  it('[AC-02] should handle invalid user ID with 404', async () => {
    const invalidUserId = uuidv4();

    const response = await request(app)
      .patch(`/api/v1/admin/users/${invalidUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: UserRole.ADMIN
      })
      .expect(404);

    expect(response.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('[AC-02] should reject update to same role with 400', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: UserRole.CUSTOMER
      })
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_USER_STATE');
  });

  it('[AC-02] should require role field', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'No role specified'
      })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('[AC-02] should reject invalid role value', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/users/${customerUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: 'INVALID_ROLE'
      })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// [AC-02] Audit log retrieval endpoint
describe('Audit Logs Endpoint - GET /api/v1/admin/audit-logs', () => {
  let app: Express;
  let adminToken: string;
  let userRepository: UserRepository;
  let auditLogRepository: AuditLogRepository;

  beforeEach(async () => {
    userRepository = new UserRepository();
    auditLogRepository = new AuditLogRepository();
    app = createApp({ userRepository, auditLogRepository });

    // Register and promote admin user
    const adminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123!'
      });

    const adminUserId = adminResponse.body.user.id;

    await userRepository.updateRole(adminUserId, UserRole.ADMIN);

    // Get a new token to include the admin role
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
  });

  it('[AC-02] should retrieve audit logs for admin users', async () => {
    const response = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.auditLogs).toBeDefined();
    expect(Array.isArray(response.body.auditLogs)).toBe(true);
  });

  it('[AC-02] should include pagination parameters', async () => {
    const response = await request(app)
      .get('/api/v1/admin/audit-logs?limit=50&offset=0')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.limit).toBe(50);
    expect(response.body.offset).toBe(0);
  });
});
