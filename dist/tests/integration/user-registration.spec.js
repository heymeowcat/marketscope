"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const app_1 = require("../../src/app");
const user_repository_1 = require("../../src/repositories/user-repository");
const audit_log_repository_1 = require("../../src/repositories/audit-log-repository");
// [AC-01] Integration tests for customer registration endpoint
(0, vitest_1.describe)('User Registration Endpoint - POST /api/v1/auth/register', () => {
    let app;
    let userRepository;
    let auditLogRepository;
    (0, vitest_1.beforeEach)(async () => {
        userRepository = new user_repository_1.UserRepository();
        auditLogRepository = new audit_log_repository_1.AuditLogRepository();
        app = (0, app_1.createApp)({ userRepository, auditLogRepository });
    });
    // [AC-01] Valid registration creates ACTIVE account
    (0, vitest_1.it)('[AC-01] should create new user in ACTIVE status with CUSTOMER role', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'customer@example.com',
            password: 'SecurePassword123!'
        })
            .expect(201);
        (0, vitest_1.expect)(response.body.token).toBeDefined();
        (0, vitest_1.expect)(response.body.user.email).toBe('customer@example.com');
        (0, vitest_1.expect)(response.body.user.role).toBe('CUSTOMER');
        (0, vitest_1.expect)(response.body.user.status).toBe('ACTIVE');
    });
    // [AC-01] Initial cash balance $100,000.00
    (0, vitest_1.it)('[AC-01] should credit initial cash balance of $100,000.00 in fixed-point decimal', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'customer@example.com',
            password: 'SecurePassword123!'
        })
            .expect(201);
        const cashBalance = new decimal_js_1.default(response.body.user.cashBalance);
        (0, vitest_1.expect)(cashBalance).toEqual(new decimal_js_1.default('100000.00'));
    });
    // [AC-01] JWT session token returned
    (0, vitest_1.it)('[AC-01] should return JWT session token in response', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'customer@example.com',
            password: 'SecurePassword123!'
        })
            .expect(201);
        (0, vitest_1.expect)(response.body.token).toBeDefined();
        (0, vitest_1.expect)(typeof response.body.token).toBe('string');
        (0, vitest_1.expect)(response.body.token.split('.').length).toBe(3); // JWT format: header.payload.signature
    });
    // [AC-01] Password hash not exposed in response
    (0, vitest_1.it)('[AC-01] should not expose password hash in response', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'customer@example.com',
            password: 'SecurePassword123!'
        })
            .expect(201);
        (0, vitest_1.expect)(response.body.user.passwordHash).toBeUndefined();
    });
    // [AC-01] Duplicate email rejection with 409 Conflict
    (0, vitest_1.it)('[AC-01] should reject duplicate email with HTTP 409 Conflict', async () => {
        // Register first user
        await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'existing@example.com',
            password: 'SecurePassword123!'
        })
            .expect(201);
        // Try to register with same email
        const response = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'existing@example.com',
            password: 'DifferentPassword123!'
        })
            .expect(409);
        (0, vitest_1.expect)(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
    (0, vitest_1.it)('[AC-01] should require email and password fields', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'test@example.com'
        })
            .expect(400);
        (0, vitest_1.expect)(response.body.error.code).toBe('VALIDATION_ERROR');
    });
    (0, vitest_1.it)('[AC-01] should reject weak password (< 8 characters)', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'test@example.com',
            password: 'Short1!'
        })
            .expect(400);
        (0, vitest_1.expect)(response.body.error.code).toBe('INVALID_PASSWORD');
    });
    (0, vitest_1.it)('[AC-01] should handle invalid email format', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'invalid-email',
            password: 'ValidPassword123!'
        })
            .expect(400);
        (0, vitest_1.expect)(response.body.error).toBeDefined();
    });
});
// [AC-01] Login endpoint tests
(0, vitest_1.describe)('User Login Endpoint - POST /api/v1/auth/login', () => {
    let app;
    let userRepository;
    let auditLogRepository;
    (0, vitest_1.beforeEach)(async () => {
        userRepository = new user_repository_1.UserRepository();
        auditLogRepository = new audit_log_repository_1.AuditLogRepository();
        app = (0, app_1.createApp)({ userRepository, auditLogRepository });
        // Register a user first
        await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'user@example.com',
            password: 'CorrectPassword123!'
        });
    });
    (0, vitest_1.it)('[AC-01] should successfully login with correct credentials', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/login')
            .send({
            email: 'user@example.com',
            password: 'CorrectPassword123!'
        })
            .expect(200);
        (0, vitest_1.expect)(response.body.token).toBeDefined();
        (0, vitest_1.expect)(response.body.user.email).toBe('user@example.com');
    });
    (0, vitest_1.it)('[AC-01] should reject login with wrong password', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/login')
            .send({
            email: 'user@example.com',
            password: 'WrongPassword123!'
        })
            .expect(401);
        (0, vitest_1.expect)(response.body.error.code).toBe('INVALID_PASSWORD');
    });
    (0, vitest_1.it)('[AC-01] should reject login with non-existent email', async () => {
        await (0, supertest_1.default)(app)
            .post('/api/v1/auth/login')
            .send({
            email: 'nonexistent@example.com',
            password: 'Password123!'
        })
            .expect(500);
    });
});
// [AC-01] Current user endpoint tests
(0, vitest_1.describe)('Get Current User Endpoint - GET /api/v1/auth/me', () => {
    let app;
    let token;
    let userRepository;
    let auditLogRepository;
    (0, vitest_1.beforeEach)(async () => {
        userRepository = new user_repository_1.UserRepository();
        auditLogRepository = new audit_log_repository_1.AuditLogRepository();
        app = (0, app_1.createApp)({ userRepository, auditLogRepository });
        const registerResponse = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'user@example.com',
            password: 'Password123!'
        });
        token = registerResponse.body.token;
    });
    (0, vitest_1.it)('[AC-01] should return current user profile with valid token', async () => {
        const response = await (0, supertest_1.default)(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        (0, vitest_1.expect)(response.body.user.email).toBe('user@example.com');
        (0, vitest_1.expect)(response.body.user.role).toBe('CUSTOMER');
    });
    (0, vitest_1.it)('[AC-01] should reject request without token', async () => {
        await (0, supertest_1.default)(app)
            .get('/api/v1/auth/me')
            .expect(401);
    });
    (0, vitest_1.it)('[AC-01] should reject request with invalid token', async () => {
        await (0, supertest_1.default)(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer invalid-token')
            .expect(401);
    });
});
//# sourceMappingURL=user-registration.spec.js.map