"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const decimal_js_1 = __importDefault(require("decimal.js"));
const auth_service_1 = require("../../../src/services/auth-service");
const user_repository_1 = require("../../../src/repositories/user-repository");
const user_1 = require("../../../src/domain/user");
const exceptions_1 = require("../../../src/domain/exceptions");
// [AC-01] Test suite for customer registration with email/password
(0, vitest_1.describe)('AuthService', () => {
    let authService;
    let userRepository;
    (0, vitest_1.beforeEach)(async () => {
        userRepository = new user_repository_1.UserRepository();
        await userRepository.clear();
        authService = new auth_service_1.AuthService({ userRepository });
    });
    (0, vitest_1.describe)('register', () => {
        // [AC-01] Valid registration scenario
        (0, vitest_1.it)('[AC-01] should register a new user with ACTIVE status and CUSTOMER role', async () => {
            const response = await authService.register({
                email: 'customer@example.com',
                password: 'SecurePassword123!'
            });
            (0, vitest_1.expect)(response.token).toBeDefined();
            (0, vitest_1.expect)(response.user.email).toBe('customer@example.com');
            (0, vitest_1.expect)(response.user.role).toBe(user_1.UserRole.CUSTOMER);
            (0, vitest_1.expect)(response.user.status).toBe(user_1.UserStatus.ACTIVE);
            (0, vitest_1.expect)(new decimal_js_1.default(response.user.cashBalance)).toEqual(new decimal_js_1.default('100000.00'));
        });
        // [AC-01] Password hashing with bcrypt
        (0, vitest_1.it)('[AC-01] should hash password using bcrypt with salt rounds >= 10', async () => {
            await authService.register({
                email: 'test@example.com',
                password: 'SecurePassword123!'
            });
            const user = await userRepository.findByEmail('test@example.com');
            (0, vitest_1.expect)(user).toBeDefined();
            (0, vitest_1.expect)(user.passwordHash).not.toBe('SecurePassword123!');
            (0, vitest_1.expect)(user.passwordHash).toMatch(/^\$2[aby]\$/);
            // Verify bcrypt hash format with salt rounds (should be $2a$10$ format)
            (0, vitest_1.expect)(user.passwordHash.substring(0, 7)).toMatch(/\$2[aby]\$\d{2}\$/);
        });
        // [AC-01] Duplicate email rejection
        (0, vitest_1.it)('[AC-01] should reject duplicate email with HTTP 409 Conflict', async () => {
            await authService.register({
                email: 'existing@example.com',
                password: 'SecurePassword123!'
            });
            (0, vitest_1.expect)(async () => {
                await authService.register({
                    email: 'existing@example.com',
                    password: 'DifferentPassword123!'
                });
            }).rejects.toThrow(exceptions_1.DuplicateEmailException);
        });
        // [AC-01] Invalid password validation
        (0, vitest_1.it)('[AC-01] should reject password shorter than 8 characters', async () => {
            (0, vitest_1.expect)(async () => {
                await authService.register({
                    email: 'test@example.com',
                    password: 'Short1!'
                });
            }).rejects.toThrow(exceptions_1.InvalidPasswordException);
        });
    });
    (0, vitest_1.describe)('login', () => {
        (0, vitest_1.beforeEach)(async () => {
            await authService.register({
                email: 'user@example.com',
                password: 'CorrectPassword123!'
            });
        });
        (0, vitest_1.it)('[AC-01] should successfully login with correct credentials', async () => {
            const response = await authService.login({
                email: 'user@example.com',
                password: 'CorrectPassword123!'
            });
            (0, vitest_1.expect)(response.token).toBeDefined();
            (0, vitest_1.expect)(response.user.email).toBe('user@example.com');
            (0, vitest_1.expect)(response.user.role).toBe(user_1.UserRole.CUSTOMER);
        });
        (0, vitest_1.it)('[AC-01] should reject login with invalid password', async () => {
            (0, vitest_1.expect)(async () => {
                await authService.login({
                    email: 'user@example.com',
                    password: 'WrongPassword123!'
                });
            }).rejects.toThrow(exceptions_1.InvalidPasswordException);
        });
        (0, vitest_1.it)('[AC-01] should reject login with non-existent email', async () => {
            (0, vitest_1.expect)(async () => {
                await authService.login({
                    email: 'nonexistent@example.com',
                    password: 'Password123!'
                });
            }).rejects.toThrow();
        });
    });
    (0, vitest_1.describe)('password hashing', () => {
        (0, vitest_1.it)('[NFR-03] should hash password using bcrypt', async () => {
            const password = 'TestPassword123!';
            const hash = await authService.hashPassword(password);
            (0, vitest_1.expect)(hash).not.toBe(password);
            (0, vitest_1.expect)(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
        });
        (0, vitest_1.it)('[NFR-03] should validate correct password against hash', async () => {
            const password = 'TestPassword123!';
            const hash = await authService.hashPassword(password);
            const isValid = await authService.validatePassword(password, hash);
            (0, vitest_1.expect)(isValid).toBe(true);
        });
        (0, vitest_1.it)('[NFR-03] should reject invalid password against hash', async () => {
            const password = 'TestPassword123!';
            const wrongPassword = 'WrongPassword123!';
            const hash = await authService.hashPassword(password);
            const isValid = await authService.validatePassword(wrongPassword, hash);
            (0, vitest_1.expect)(isValid).toBe(false);
        });
    });
});
//# sourceMappingURL=auth-service.spec.js.map