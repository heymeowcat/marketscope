"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../src/app");
const user_repository_1 = require("../../src/repositories/user-repository");
// [NFR-03] Security tests for password hashing and protection
(0, vitest_1.describe)('Password Security - NFR-03', () => {
    let app;
    let userRepository;
    (0, vitest_1.beforeEach)(async () => {
        userRepository = new user_repository_1.UserRepository();
        const auditLogRepository = new (await Promise.resolve().then(() => __importStar(require('../../src/repositories/audit-log-repository')))).AuditLogRepository();
        app = (0, app_1.createApp)({ userRepository, auditLogRepository });
    });
    (0, vitest_1.describe)('Password Hashing', () => {
        // [NFR-03] Password must be hashed with bcrypt
        (0, vitest_1.it)('[NFR-03] should hash password using bcrypt (not stored in plaintext)', async () => {
            const plainPassword = 'TestPassword123!';
            await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: plainPassword
            })
                .expect(201);
            const user = await userRepository.findByEmail('test@example.com');
            (0, vitest_1.expect)(user).toBeDefined();
            (0, vitest_1.expect)(user.passwordHash).not.toBe(plainPassword);
            (0, vitest_1.expect)(user.passwordHash).toMatch(/^\$2[aby]\$/);
        });
        // [NFR-03] Bcrypt salt rounds >= 10
        (0, vitest_1.it)('[NFR-03] should use bcrypt with salt rounds >= 10', async () => {
            const plainPassword = 'TestPassword123!';
            await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: plainPassword
            })
                .expect(201);
            const user = await userRepository.findByEmail('test@example.com');
            const hash = user.passwordHash;
            // Bcrypt hash format: $2a$10$... where 10 is the salt rounds
            const saltRoundsMatch = hash.match(/\$2[aby]\$(\d{2})\$/);
            (0, vitest_1.expect)(saltRoundsMatch).not.toBeNull();
            const saltRounds = parseInt(saltRoundsMatch[1], 10);
            (0, vitest_1.expect)(saltRounds).toBeGreaterThanOrEqual(10);
        });
        (0, vitest_1.it)('[NFR-03] should produce different hash for same password on each registration', async () => {
            const plainPassword = 'TestPassword123!';
            const response1 = await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test1@example.com',
                password: plainPassword
            })
                .expect(201);
            const response2 = await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test2@example.com',
                password: plainPassword
            })
                .expect(201);
            const user1 = await userRepository.findByEmail('test1@example.com');
            const user2 = await userRepository.findByEmail('test2@example.com');
            // Same password should produce different hashes (due to salt)
            (0, vitest_1.expect)(user1.passwordHash).not.toBe(user2.passwordHash);
        });
    });
    (0, vitest_1.describe)('Password Not Exposed in Responses', () => {
        // [NFR-03] Plaintext passwords never in responses
        (0, vitest_1.it)('[NFR-03] should never expose plaintext password in registration response', async () => {
            const plainPassword = 'TestPassword123!';
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: plainPassword
            })
                .expect(201);
            (0, vitest_1.expect)(response.body.user.password).toBeUndefined();
            (0, vitest_1.expect)(response.body.user.passwordHash).toBeUndefined();
            (0, vitest_1.expect)(JSON.stringify(response.body)).not.toContain(plainPassword);
        });
        (0, vitest_1.it)('[NFR-03] should never expose plaintext password in login response', async () => {
            const plainPassword = 'TestPassword123!';
            await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: plainPassword
            })
                .expect(201);
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/auth/login')
                .send({
                email: 'test@example.com',
                password: plainPassword
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.user.password).toBeUndefined();
            (0, vitest_1.expect)(response.body.user.passwordHash).toBeUndefined();
            (0, vitest_1.expect)(JSON.stringify(response.body)).not.toContain(plainPassword);
        });
        (0, vitest_1.it)('[NFR-03] should never expose plaintext password in current user response', async () => {
            const plainPassword = 'TestPassword123!';
            const registerResponse = await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: plainPassword
            })
                .expect(201);
            const token = registerResponse.body.token;
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.user.password).toBeUndefined();
            (0, vitest_1.expect)(response.body.user.passwordHash).toBeUndefined();
            (0, vitest_1.expect)(JSON.stringify(response.body)).not.toContain(plainPassword);
        });
    });
    (0, vitest_1.describe)('Password Validation', () => {
        (0, vitest_1.it)('[NFR-03] should reject passwords shorter than 8 characters', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: 'Short1!'
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.error.code).toBe('INVALID_PASSWORD');
        });
        (0, vitest_1.it)('[NFR-03] should accept strong password (8+ characters)', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: 'LongEnoughPassword123!'
            })
                .expect(201);
            (0, vitest_1.expect)(response.body.user.email).toBe('test@example.com');
        });
    });
    (0, vitest_1.describe)('Authentication Verification', () => {
        (0, vitest_1.it)('[NFR-03] should verify password correctly during login', async () => {
            const plainPassword = 'TestPassword123!';
            await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: plainPassword
            })
                .expect(201);
            // Login with correct password should succeed
            const loginResponse = await (0, supertest_1.default)(app)
                .post('/api/v1/auth/login')
                .send({
                email: 'test@example.com',
                password: plainPassword
            })
                .expect(200);
            (0, vitest_1.expect)(loginResponse.body.token).toBeDefined();
        });
        (0, vitest_1.it)('[NFR-03] should reject login with incorrect password', async () => {
            const plainPassword = 'TestPassword123!';
            await (0, supertest_1.default)(app)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: plainPassword
            })
                .expect(201);
            // Login with wrong password should fail
            const loginResponse = await (0, supertest_1.default)(app)
                .post('/api/v1/auth/login')
                .send({
                email: 'test@example.com',
                password: 'WrongPassword123!'
            })
                .expect(401);
            (0, vitest_1.expect)(loginResponse.body.error.code).toBe('INVALID_PASSWORD');
        });
    });
});
//# sourceMappingURL=password-security.spec.js.map