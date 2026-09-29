"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const decimal_js_1 = __importDefault(require("decimal.js"));
const user_admin_service_1 = require("../../../src/services/user-admin-service");
const user_repository_1 = require("../../../src/repositories/user-repository");
const audit_log_repository_1 = require("../../../src/repositories/audit-log-repository");
const user_1 = require("../../../src/domain/user");
const exceptions_1 = require("../../../src/domain/exceptions");
const uuid_1 = require("uuid");
// [AC-02] Test suite for admin role updates and audit logging
(0, vitest_1.describe)('UserAdminService', () => {
    let userAdminService;
    let userRepository;
    let auditLogRepository;
    (0, vitest_1.beforeEach)(async () => {
        userRepository = new user_repository_1.UserRepository();
        auditLogRepository = new audit_log_repository_1.AuditLogRepository();
        await userRepository.clear();
        await auditLogRepository.clear();
        userAdminService = new user_admin_service_1.UserAdminService({ userRepository, auditLogRepository });
    });
    (0, vitest_1.describe)('updateUserRole', () => {
        let adminUserId;
        let customerUserId;
        (0, vitest_1.beforeEach)(async () => {
            adminUserId = (0, uuid_1.v4)();
            customerUserId = (0, uuid_1.v4)();
            // Create admin user
            await userRepository.create({
                id: adminUserId,
                email: 'admin@example.com',
                passwordHash: 'hash',
                role: user_1.UserRole.ADMIN,
                status: user_1.UserStatus.ACTIVE,
                cashBalance: new decimal_js_1.default('100000.00'),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            // Create customer user
            await userRepository.create({
                id: customerUserId,
                email: 'customer@example.com',
                passwordHash: 'hash',
                role: user_1.UserRole.CUSTOMER,
                status: user_1.UserStatus.ACTIVE,
                cashBalance: new decimal_js_1.default('50000.00'),
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });
        // [AC-02] Admin updates user role and creates audit log
        (0, vitest_1.it)('[AC-02] should update user role from CUSTOMER to SUSPENDED', async () => {
            const result = await userAdminService.updateUserRole(customerUserId, adminUserId, {
                role: user_1.UserRole.SUSPENDED,
                reason: 'Compliance review'
            });
            (0, vitest_1.expect)(result.role).toBe(user_1.UserRole.SUSPENDED);
            (0, vitest_1.expect)(result.id).toBe(customerUserId);
        });
        // [AC-02] Audit log entry creation
        (0, vitest_1.it)('[AC-02] should create audit log entry with all required fields', async () => {
            await userAdminService.updateUserRole(customerUserId, adminUserId, {
                role: user_1.UserRole.SUSPENDED,
                reason: 'Compliance review'
            });
            const logs = await auditLogRepository.getAll();
            (0, vitest_1.expect)(logs).toHaveLength(1);
            const auditLog = logs[0];
            (0, vitest_1.expect)(auditLog.auditId).toBeDefined();
            (0, vitest_1.expect)(auditLog.targetUserId).toBe(customerUserId);
            (0, vitest_1.expect)(auditLog.previousRole).toBe(user_1.UserRole.CUSTOMER);
            (0, vitest_1.expect)(auditLog.newRole).toBe(user_1.UserRole.SUSPENDED);
            (0, vitest_1.expect)(auditLog.actorUserId).toBe(adminUserId);
            (0, vitest_1.expect)(auditLog.timestamp).toBeInstanceOf(Date);
            (0, vitest_1.expect)(auditLog.reason).toBe('Compliance review');
        });
        // [AC-02] Audit log timestamp in UTC ISO-8601 format
        (0, vitest_1.it)('[AC-02] should store audit log timestamp in UTC ISO-8601 format', async () => {
            const beforeTime = new Date();
            await userAdminService.updateUserRole(customerUserId, adminUserId, {
                role: user_1.UserRole.SUSPENDED
            });
            const afterTime = new Date();
            const logs = await auditLogRepository.getAll();
            const timestamp = logs[0].timestamp;
            (0, vitest_1.expect)(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            (0, vitest_1.expect)(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        });
        (0, vitest_1.it)('[AC-02] should update user role from CUSTOMER to ADMIN', async () => {
            const result = await userAdminService.updateUserRole(customerUserId, adminUserId, {
                role: user_1.UserRole.ADMIN,
                reason: 'Promotion'
            });
            (0, vitest_1.expect)(result.role).toBe(user_1.UserRole.ADMIN);
        });
        (0, vitest_1.it)('[AC-02] should throw error when updating user to same role', async () => {
            (0, vitest_1.expect)(async () => {
                await userAdminService.updateUserRole(customerUserId, adminUserId, {
                    role: user_1.UserRole.CUSTOMER
                });
            }).rejects.toThrow(exceptions_1.InvalidUserStateException);
        });
        (0, vitest_1.it)('[AC-02] should throw error when user does not exist', async () => {
            const nonExistentUserId = (0, uuid_1.v4)();
            (0, vitest_1.expect)(async () => {
                await userAdminService.updateUserRole(nonExistentUserId, adminUserId, {
                    role: user_1.UserRole.ADMIN
                });
            }).rejects.toThrow(exceptions_1.UserNotFoundException);
        });
        (0, vitest_1.it)('[AC-02] should not create audit log when update fails', async () => {
            const nonExistentUserId = (0, uuid_1.v4)();
            try {
                await userAdminService.updateUserRole(nonExistentUserId, adminUserId, {
                    role: user_1.UserRole.ADMIN
                });
            }
            catch (error) {
                // Expected to fail
            }
            const logs = await auditLogRepository.getAll();
            (0, vitest_1.expect)(logs).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('getAuditLogs', () => {
        (0, vitest_1.it)('[AC-02] should return audit logs with pagination', async () => {
            const adminUserId = (0, uuid_1.v4)();
            const customerUserId = (0, uuid_1.v4)();
            // Create users
            await userRepository.create({
                id: adminUserId,
                email: 'admin@example.com',
                passwordHash: 'hash',
                role: user_1.UserRole.ADMIN,
                status: user_1.UserStatus.ACTIVE,
                cashBalance: new decimal_js_1.default('100000.00'),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await userRepository.create({
                id: customerUserId,
                email: 'customer@example.com',
                passwordHash: 'hash',
                role: user_1.UserRole.CUSTOMER,
                status: user_1.UserStatus.ACTIVE,
                cashBalance: new decimal_js_1.default('50000.00'),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            // Create multiple audit logs
            await userAdminService.updateUserRole(customerUserId, adminUserId, {
                role: user_1.UserRole.SUSPENDED
            });
            await userAdminService.updateUserRole(customerUserId, adminUserId, {
                role: user_1.UserRole.CUSTOMER
            });
            const logs = await userAdminService.getAuditLogs(10, 0);
            (0, vitest_1.expect)(logs).toHaveLength(2);
            (0, vitest_1.expect)(logs[0].targetUserId).toBe(customerUserId);
            (0, vitest_1.expect)(logs[1].targetUserId).toBe(customerUserId);
        });
        (0, vitest_1.it)('[AC-02] should return audit logs in ISO-8601 format', async () => {
            const adminUserId = (0, uuid_1.v4)();
            const customerUserId = (0, uuid_1.v4)();
            await userRepository.create({
                id: adminUserId,
                email: 'admin@example.com',
                passwordHash: 'hash',
                role: user_1.UserRole.ADMIN,
                status: user_1.UserStatus.ACTIVE,
                cashBalance: new decimal_js_1.default('100000.00'),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await userRepository.create({
                id: customerUserId,
                email: 'customer@example.com',
                passwordHash: 'hash',
                role: user_1.UserRole.CUSTOMER,
                status: user_1.UserStatus.ACTIVE,
                cashBalance: new decimal_js_1.default('50000.00'),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await userAdminService.updateUserRole(customerUserId, adminUserId, {
                role: user_1.UserRole.SUSPENDED
            });
            const logs = await userAdminService.getAuditLogs(10, 0);
            (0, vitest_1.expect)(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });
    });
});
//# sourceMappingURL=user-admin-service.spec.js.map