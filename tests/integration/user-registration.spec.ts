import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Decimal from 'decimal.js';
import { createApp } from '../../src/app';
import { UserRepository } from '../../src/repositories/user-repository';
import { AuditLogRepository } from '../../src/repositories/audit-log-repository';
import { Express } from 'express';

// [AC-01] Integration tests for customer registration endpoint
describe('User Registration Endpoint - POST /api/v1/auth/register', () => {
  let app: Express;
  let userRepository: UserRepository;
  let auditLogRepository: AuditLogRepository;

  beforeEach(async () => {
    userRepository = new UserRepository();
    auditLogRepository = new AuditLogRepository();
    app = createApp({ userRepository, auditLogRepository });
  });

  // [AC-01] Valid registration creates ACTIVE account
  it('[AC-01] should create new user in ACTIVE status with CUSTOMER role', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'customer@example.com',
        password: 'SecurePassword123!'
      })
      .expect(201);

    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('customer@example.com');
    expect(response.body.user.role).toBe('CUSTOMER');
    expect(response.body.user.status).toBe('ACTIVE');
  });

  // [AC-01] Initial cash balance $100,000.00
  it('[AC-01] should credit initial cash balance of $100,000.00 in fixed-point decimal', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'customer@example.com',
        password: 'SecurePassword123!'
      })
      .expect(201);

    const cashBalance = new Decimal(response.body.user.cashBalance);
    expect(cashBalance).toEqual(new Decimal('100000.00'));
  });

  // [AC-01] JWT session token returned
  it('[AC-01] should return JWT session token in response', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'customer@example.com',
        password: 'SecurePassword123!'
      })
      .expect(201);

    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.split('.').length).toBe(3); // JWT format: header.payload.signature
  });

  // [AC-01] Password hash not exposed in response
  it('[AC-01] should not expose password hash in response', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'customer@example.com',
        password: 'SecurePassword123!'
      })
      .expect(201);

    expect(response.body.user.passwordHash).toBeUndefined();
  });

  // [AC-01] Duplicate email rejection with 409 Conflict
  it('[AC-01] should reject duplicate email with HTTP 409 Conflict', async () => {
    // Register first user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'existing@example.com',
        password: 'SecurePassword123!'
      })
      .expect(201);

    // Try to register with same email
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'existing@example.com',
        password: 'DifferentPassword123!'
      })
      .expect(409);

    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('[AC-01] should require email and password fields', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com'
      })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('[AC-01] should reject weak password (< 8 characters)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Short1!'
      })
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_PASSWORD');
  });

  it('[AC-01] should handle invalid email format', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-email',
        password: 'ValidPassword123!'
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });
});

// [AC-01] Login endpoint tests
describe('User Login Endpoint - POST /api/v1/auth/login', () => {
  let app: Express;
  let userRepository: UserRepository;
  let auditLogRepository: AuditLogRepository;

  beforeEach(async () => {
    userRepository = new UserRepository();
    auditLogRepository = new AuditLogRepository();
    app = createApp({ userRepository, auditLogRepository });
    // Register a user first
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        password: 'CorrectPassword123!'
      });
  });

  it('[AC-01] should successfully login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'CorrectPassword123!'
      })
      .expect(200);

    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('user@example.com');
  });

  it('[AC-01] should reject login with wrong password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'WrongPassword123!'
      })
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_PASSWORD');
  });

  it('[AC-01] should reject login with non-existent email', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Password123!'
      })
      .expect(500);
  });
});

// [AC-01] Current user endpoint tests
describe('Get Current User Endpoint - GET /api/v1/auth/me', () => {
  let app: Express;
  let token: string;
  let userRepository: UserRepository;
  let auditLogRepository: AuditLogRepository;

  beforeEach(async () => {
    userRepository = new UserRepository();
    auditLogRepository = new AuditLogRepository();
    app = createApp({ userRepository, auditLogRepository });
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        password: 'Password123!'
      });

    token = registerResponse.body.token;
  });

  it('[AC-01] should return current user profile with valid token', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.user.email).toBe('user@example.com');
    expect(response.body.user.role).toBe('CUSTOMER');
  });

  it('[AC-01] should reject request without token', async () => {
    await request(app)
      .get('/api/v1/auth/me')
      .expect(401);
  });

  it('[AC-01] should reject request with invalid token', async () => {
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
