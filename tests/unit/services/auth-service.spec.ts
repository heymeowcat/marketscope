import { describe, it, expect, beforeEach, vi } from 'vitest';
import Decimal from 'decimal.js';
import { AuthService } from '../../../src/services/auth-service';
import { UserRepository } from '../../../src/repositories/user-repository';
import { UserRole, UserStatus } from '../../../src/domain/user';
import {
  DuplicateEmailException,
  InvalidPasswordException,
  UserNotFoundException
} from '../../../src/domain/exceptions';

// [AC-01] Test suite for customer registration with email/password
describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    userRepository = new UserRepository();
    await userRepository.clear();
    authService = new AuthService({ userRepository });
  });

  describe('register', () => {
    // [AC-01] Valid registration scenario
    it('[AC-01] should register a new user with ACTIVE status and CUSTOMER role', async () => {
      const response = await authService.register({
        email: 'customer@example.com',
        password: 'SecurePassword123!'
      });

      expect(response.token).toBeDefined();
      expect(response.user.email).toBe('customer@example.com');
      expect(response.user.role).toBe(UserRole.CUSTOMER);
      expect(response.user.status).toBe(UserStatus.ACTIVE);
      expect(new Decimal(response.user.cashBalance)).toEqual(new Decimal('100000.00'));
    });

    // [AC-01] Password hashing with bcrypt
    it('[AC-01] should hash password using bcrypt with salt rounds >= 10', async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'SecurePassword123!'
      });

      const user = await userRepository.findByEmail('test@example.com');
      expect(user).toBeDefined();
      expect(user!.passwordHash).not.toBe('SecurePassword123!');
      expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);
      // Verify bcrypt hash format with salt rounds (should be $2a$10$ format)
      expect(user!.passwordHash.substring(0, 7)).toMatch(/\$2[aby]\$\d{2}\$/);
    });

    // [AC-01] Duplicate email rejection
    it('[AC-01] should reject duplicate email with HTTP 409 Conflict', async () => {
      await authService.register({
        email: 'existing@example.com',
        password: 'SecurePassword123!'
      });

      await expect(authService.register({
        email: 'existing@example.com',
        password: 'DifferentPassword123!'
      })).rejects.toThrow(DuplicateEmailException);
    });

    // [AC-01] Invalid password validation
    it('[AC-01] should reject password shorter than 8 characters', async () => {
      await expect(authService.register({
        email: 'test@example.com',
        password: 'Short1!'
      })).rejects.toThrow(InvalidPasswordException);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'user@example.com',
        password: 'CorrectPassword123!'
      });
    });

    it('[AC-01] should successfully login with correct credentials', async () => {
      const response = await authService.login({
        email: 'user@example.com',
        password: 'CorrectPassword123!'
      });

      expect(response.token).toBeDefined();
      expect(response.user.email).toBe('user@example.com');
      expect(response.user.role).toBe(UserRole.CUSTOMER);
    });

    it('[AC-01] should reject login with invalid password', async () => {
      await expect(authService.login({
        email: 'user@example.com',
        password: 'WrongPassword123!'
      })).rejects.toThrow(InvalidPasswordException);
    });

    it('[AC-01] should reject login with non-existent email', async () => {
      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'Password123!'
      })).rejects.toThrow();
    });
  });

  describe('password hashing', () => {
    it('[NFR-03] should hash password using bcrypt', async () => {
      const password = 'TestPassword123!';
      const hash = await authService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('[NFR-03] should validate correct password against hash', async () => {
      const password = 'TestPassword123!';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.validatePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('[NFR-03] should reject invalid password against hash', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.validatePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });
});
