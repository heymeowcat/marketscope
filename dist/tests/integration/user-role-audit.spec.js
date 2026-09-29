"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../src/app");
const user_repository_1 = require("../../src/repositories/user-repository");
const audit_log_repository_1 = require("../../src/repositories/audit-log-repository");
const user_1 = require("../../src/domain/user");
const uuid_1 = require("uuid");
// [AC-02] Integration tests for admin role updates and audit logging
(0, vitest_1.describe)('User Role Update Endpoint - PATCH /api/v1/admin/users/:id/role', () => {
    let app;
    let adminToken;
    let customerUserId;
    let userRepository;
    let auditLogRepository;
    (0, vitest_1.beforeEach)(async () => {
        userRepository = new user_repository_1.UserRepository();
        auditLogRepository = new audit_log_repository_1.AuditLogRepository();
        app = (0, app_1.createApp)({ userRepository, auditLogRepository });
        // Register admin user first as customer
        let adminResponse = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'admin@example.com',
            password: 'AdminPassword123!'
        });
        const adminUserId = adminResponse.body.user.id;
        // Manually set admin role in repository for testing
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
        customerUserId = customerResponse.body.user.id;
    });
    // [AC-02] Admin updates user role successfully
    (0, vitest_1.it)('[AC-02] should update user role from CUSTOMER to SUSPENDED', async () => {
        const response = await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            role: user_1.UserRole.SUSPENDED,
            reason: 'Compliance review'
        })
            .expect(200);
        (0, vitest_1.expect)(response.body.user.role).toBe(user_1.UserRole.SUSPENDED);
        (0, vitest_1.expect)(response.body.user.id).toBe(customerUserId);
    });
    // [AC-02] Audit log created with all required fields
    (0, vitest_1.it)('[AC-02] should create audit log entry with actor, timestamp, and reason', async () => {
        const beforeUpdate = new Date();
        await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            role: user_1.UserRole.SUSPENDED,
            reason: 'Compliance review'
        })
            .expect(200);
        const afterUpdate = new Date();
        const auditLogs = await auditLogRepository.getAll();
        (0, vitest_1.expect)(auditLogs).toHaveLength(1);
        const auditLog = auditLogs[0];
        (0, vitest_1.expect)(auditLog.auditId).toBeDefined();
        (0, vitest_1.expect)(auditLog.targetUserId).toBe(customerUserId);
        (0, vitest_1.expect)(auditLog.previousRole).toBe(user_1.UserRole.CUSTOMER);
        (0, vitest_1.expect)(auditLog.newRole).toBe(user_1.UserRole.SUSPENDED);
        (0, vitest_1.expect)(auditLog.reason).toBe('Compliance review');
        (0, vitest_1.expect)(auditLog.timestamp.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        (0, vitest_1.expect)(auditLog.timestamp.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });
    // [AC-02] Audit log timestamp in UTC ISO-8601 format
    (0, vitest_1.it)('[AC-02] should return audit log timestamp in UTC ISO-8601 format', async () => {
        await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            role: user_1.UserRole.SUSPENDED,
            reason: 'Test reason'
        })
            .expect(200);
        const logs = await auditLogRepository.getAll();
        const isoTimestamp = logs[0].timestamp.toISOString();
        (0, vitest_1.expect)(isoTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
    // [AC-02] Role transitions
    (0, vitest_1.it)('[AC-02] should support role transition CUSTOMER -> ADMIN', async () => {
        const response = await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            role: user_1.UserRole.ADMIN,
            reason: 'Promotion'
        })
            .expect(200);
        (0, vitest_1.expect)(response.body.user.role).toBe(user_1.UserRole.ADMIN);
    });
    (0, vitest_1.it)('[AC-02] should support role transition SUSPENDED -> CUSTOMER', async () => {
        // First suspend the user
        await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            role: user_1.UserRole.SUSPENDED
        })
            .expect(200);
        // Then unsuspend
        const response = await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            role: user_1.UserRole.CUSTOMER,
            reason: 'Compliance check passed'
        })
            .expect(200);
        (0, vitest_1.expect)(response.body.user.role).toBe(user_1.UserRole.CUSTOMER);
        const logs = await auditLogRepository.getAll();
        (0, vitest_1.expect)(logs).toHaveLength(2);
        (0, vitest_1.expect)(logs[1].previousRole).toBe(user_1.UserRole.SUSPENDED);
        (0, vitest_1.expect)(logs[1].newRole).toBe(user_1.UserRole.CUSTOMER);
    });
    (0, vitest_1.it)('[AC-02] should handle invalid user ID with 404', async () => {
        const invalidUserId = (0, uuid_1.v4)();
        const response = await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${invalidUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            role: user_1.UserRole.ADMIN
        })
            .expect(404);
        (0, vitest_1.expect)(response.body.error.code).toBe('USER_NOT_FOUND');
    });
    (0, vitest_1.it)('[AC-02] should reject update to same role with 400', async () => {
        const response = await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            role: user_1.UserRole.CUSTOMER
        })
            .expect(400);
        (0, vitest_1.expect)(response.body.error.code).toBe('INVALID_USER_STATE');
    });
    (0, vitest_1.it)('[AC-02] should require role field', async () => {
        const response = await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            reason: 'No role specified'
        })
            .expect(400);
        (0, vitest_1.expect)(response.body.error.code).toBe('VALIDATION_ERROR');
    });
    (0, vitest_1.it)('[AC-02] should reject invalid role value', async () => {
        const response = await (0, supertest_1.default)(app)
            .patch(`/api/v1/admin/users/${customerUserId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            role: 'INVALID_ROLE'
        })
            .expect(400);
        (0, vitest_1.expect)(response.body.error.code).toBe('VALIDATION_ERROR');
    });
});
// [AC-02] Audit log retrieval endpoint
(0, vitest_1.describe)('Audit Logs Endpoint - GET /api/v1/admin/audit-logs', () => {
    let app;
    let adminToken;
    let userRepository;
    let auditLogRepository;
    (0, vitest_1.beforeEach)(async () => {
        userRepository = new user_repository_1.UserRepository();
        auditLogRepository = new audit_log_repository_1.AuditLogRepository();
        app = (0, app_1.createApp)({ userRepository, auditLogRepository });
        // Register and promote admin user
        const adminResponse = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({
            email: 'admin@example.com',
            password: 'AdminPassword123!'
        });
        const adminUserId = adminResponse.body.user.id;
        await userRepository.updateRole(adminUserId, user_1.UserRole.ADMIN);
        // Get a new token to include the admin role
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
        adminToken = jwt.sign({
            userId: adminUserId,
            email: 'admin@example.com',
            role: user_1.UserRole.ADMIN
        }, JWT_SECRET, { expiresIn: '24h' });
    });
    (0, vitest_1.it)('[AC-02] should retrieve audit logs for admin users', async () => {
        const response = await (0, supertest_1.default)(app)
            .get('/api/v1/admin/audit-logs')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        (0, vitest_1.expect)(response.body.auditLogs).toBeDefined();
        (0, vitest_1.expect)(Array.isArray(response.body.auditLogs)).toBe(true);
    });
    (0, vitest_1.it)('[AC-02] should include pagination parameters', async () => {
        const response = await (0, supertest_1.default)(app)
            .get('/api/v1/admin/audit-logs?limit=50&offset=0')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        (0, vitest_1.expect)(response.body.limit).toBe(50);
        (0, vitest_1.expect)(response.body.offset).toBe(0);
    });
});
//# sourceMappingURL=user-role-audit.spec.js.map