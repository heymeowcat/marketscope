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
const user_1 = require("../../src/domain/user");
// [NFR-04] Integration tests for role-based access control
(0, vitest_1.describe)('Admin Role Protection - NFR-04', () => {
    let app;
    let adminToken;
    let customerToken;
    let customerUserId;
    let userRepository;
    (0, vitest_1.beforeEach)(async () => {
        userRepository = new user_repository_1.UserRepository();
        const auditLogRepository = new (await Promise.resolve().then(() => __importStar(require('../../src/repositories/audit-log-repository')))).AuditLogRepository();
        app = (0, app_1.createApp)({ userRepository, auditLogRepository });
        // Register admin user first as customer
        const adminResponse = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'admin@example.com',
            password: 'AdminPassword123!'
        });
        const adminUserId = adminResponse.body.user.id;
        // Manually set admin role
        await userRepository.updateRole(adminUserId, user_1.UserRole.ADMIN);
        // Get a new token to include the admin role
        // For testing, we'll manually create a JWT with admin role
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
        adminToken = jwt.sign({
            userId: adminUserId,
            email: 'admin@example.com',
            role: user_1.UserRole.ADMIN
        }, JWT_SECRET, { expiresIn: '24h' });
        // Register customer user
        const customerResponse = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'customer@example.com',
            password: 'CustomerPassword123!'
        });
        customerToken = customerResponse.body.token;
        customerUserId = customerResponse.body.user.id;
    });
    // [NFR-04] Non-admin role update rejection
    (0, vitest_1.it)('[NFR-04] should reject role update from CUSTOMER with HTTP 403 Forbidden', async () => {
        const response = await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
            role: user_1.UserRole.ADMIN
        })
            .expect(403);
        (0, vitest_1.expect)(response.body.error.code).toBe('ROLE_ACCESS_DENIED');
    });
    (0, vitest_1.it)('[NFR-04] should allow role update from ADMIN with HTTP 200', async () => {
        const response = await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            role: user_1.UserRole.SUSPENDED
        })
            .expect(200);
        (0, vitest_1.expect)(response.body.user.role).toBe(user_1.UserRole.SUSPENDED);
    });
    (0, vitest_1.it)('[NFR-04] should reject audit log retrieval from CUSTOMER', async () => {
        const response = await (0, supertest_1.default)(app)
            .get('/api/v1/admin/audit-logs')
            .set('Authorization', `Bearer ${customerToken}`)
            .expect(403);
        (0, vitest_1.expect)(response.body.error.code).toBe('ROLE_ACCESS_DENIED');
    });
    (0, vitest_1.it)('[NFR-04] should allow audit log retrieval from ADMIN', async () => {
        await (0, supertest_1.default)(app)
            .get('/api/v1/admin/audit-logs')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
    });
    (0, vitest_1.it)('[NFR-04] should reject users list from CUSTOMER', async () => {
        const response = await (0, supertest_1.default)(app)
            .get('/api/v1/admin/users')
            .set('Authorization', `Bearer ${customerToken}`)
            .expect(403);
        (0, vitest_1.expect)(response.body.error.code).toBe('ROLE_ACCESS_DENIED');
    });
    (0, vitest_1.it)('[NFR-04] should allow users list from ADMIN', async () => {
        const response = await (0, supertest_1.default)(app)
            .get('/api/v1/admin/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        (0, vitest_1.expect)(response.body.users).toBeDefined();
    });
    (0, vitest_1.it)('[NFR-04] should reject requests without authentication', async () => {
        const response = await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .send({
            role: user_1.UserRole.ADMIN
        })
            .expect(401);
        (0, vitest_1.expect)(response.body.error.code).toBe('UNAUTHORIZED');
    });
    (0, vitest_1.it)('[NFR-04] should not create audit log for rejected requests', async () => {
        const auditLogRepository = new (await Promise.resolve().then(() => __importStar(require('../../src/repositories/audit-log-repository')))).AuditLogRepository();
        await auditLogRepository.clear();
        // Attempt role update with customer token (should be rejected)
        await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
            role: user_1.UserRole.ADMIN
        })
            .expect(403);
        const logs = await auditLogRepository.getAll();
        (0, vitest_1.expect)(logs).toHaveLength(0);
    });
});
//# sourceMappingURL=admin-role-protection.spec.js.map