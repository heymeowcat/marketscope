import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Decimal from 'decimal.js';
import { createApp } from '../../src/app';
import { UserRepository } from '../../src/repositories/user-repository';
import { UserRole, UserStatus } from '../../src/domain/user';
import { Express } from 'express';

// [NFR-03] Security tests for password hashing and protection
describe('Password Security - NFR-03', () => {
  let app: Express;
  let userRepository: UserRepository;

  beforeEach(async () => {
    userRepository = new UserRepository();
    const auditLogRepository = new (await import('../../src/repositories/audit-log-repository')).AuditLogRepository();
    app = createApp({ userRepository, auditLogRepository });
  });

  describe('Password Hashing', () => {
    // [NFR-03] Password must be hashed with bcrypt
    it('[NFR-03] should hash password using bcrypt (not stored in plaintext)', async () => {
      const plainPassword = 'TestPassword123!';

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: plainPassword
        })
        .expect(201);

      const user = await userRepository.findByEmail('test@example.com');
      expect(user).toBeDefined();
      expect(user!.passwordHash).not.toBe(plainPassword);
      expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    // [NFR-03] Bcrypt salt rounds >= 10
    it('[NFR-03] should use bcrypt with salt rounds >= 10', async () => {
      const plainPassword = 'TestPassword123!';

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: plainPassword
        })
        .expect(201);

      const user = await userRepository.findByEmail('test@example.com');
      const hash = user!.passwordHash;

      // Bcrypt hash format: $2a$10$... where 10 is the salt rounds
      const saltRoundsMatch = hash.match(/\$2[aby]\$(\d{2})\$/);
      expect(saltRoundsMatch).not.toBeNull();
      const saltRounds = parseInt(saltRoundsMatch![1], 10);
      expect(saltRounds).toBeGreaterThanOrEqual(10);
    });

    it('[NFR-03] should produce different hash for same password on each registration', async () => {
      const plainPassword = 'TestPassword123!';

      const response1 = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test1@example.com',
          password: plainPassword
        })
        .expect(201);

      const response2 = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test2@example.com',
          password: plainPassword
        })
        .expect(201);

      const user1 = await userRepository.findByEmail('test1@example.com');
      const user2 = await userRepository.findByEmail('test2@example.com');

      // Same password should produce different hashes (due to salt)
      expect(user1!.passwordHash).not.toBe(user2!.passwordHash);
    });
  });

  describe('Password Not Exposed in Responses', () => {
    // [NFR-03] Plaintext passwords never in responses
    it('[NFR-03] should never expose plaintext password in registration response', async () => {
      const plainPassword = 'TestPassword123!';

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: plainPassword
        })
        .expect(201);

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain(plainPassword);
    });

    it('[NFR-03] should never expose plaintext password in login response', async () => {
      const plainPassword = 'TestPassword123!';

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: plainPassword
        })
        .expect(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: plainPassword
        })
        .expect(200);

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain(plainPassword);
    });

    it('[NFR-03] should never expose plaintext password in current user response', async () => {
      const plainPassword = 'TestPassword123!';

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: plainPassword
        })
        .expect(201);

      const token = registerResponse.body.token;

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain(plainPassword);
    });
  });

  describe('Password Validation', () => {
    it('[NFR-03] should reject passwords shorter than 8 characters', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Short1!'
        })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('[NFR-03] should accept strong password (8+ characters)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'LongEnoughPassword123!'
        })
        .expect(201);

      expect(response.body.user.email).toBe('test@example.com');
    });
  });

  describe('Authentication Verification', () => {
    it('[NFR-03] should verify password correctly during login', async () => {
      const plainPassword = 'TestPassword123!';

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: plainPassword
        })
        .expect(201);

      // Login with correct password should succeed
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: plainPassword
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();
    });

    it('[NFR-03] should reject login with incorrect password', async () => {
      const plainPassword = 'TestPassword123!';

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: plainPassword
        })
        .expect(201);

      // Login with wrong password should fail
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(loginResponse.body.error.code).toBe('INVALID_PASSWORD');
    });
  });
});
