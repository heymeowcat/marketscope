import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import { UserAdminService } from '../../../src/services/user-admin-service';
import { UserRepository } from '../../../src/repositories/user-repository';
import { AuditLogRepository } from '../../../src/repositories/audit-log-repository';
import { UserRole, UserStatus } from '../../../src/domain/user';
import { UserNotFoundException, InvalidUserStateException } from '../../../src/domain/exceptions';
import { v4 as uuidv4 } from 'uuid';

// [AC-02] Test suite for admin role updates and audit logging
describe('UserAdminService', () => {
  let userAdminService: UserAdminService;
  let userRepository: UserRepository;
  let auditLogRepository: AuditLogRepository;

  beforeEach(async () => {
    userRepository = new UserRepository();
    auditLogRepository = new AuditLogRepository();
    await userRepository.clear();
    await auditLogRepository.clear();
    userAdminService = new UserAdminService({ userRepository, auditLogRepository });
  });

  describe('updateUserRole', () => {
    let adminUserId: string;
    let customerUserId: string;

    beforeEach(async () => {
      adminUserId = uuidv4();
      customerUserId = uuidv4();

      // Create admin user
      await userRepository.create({
        id: adminUserId,
        email: 'admin@example.com',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        cashBalance: new Decimal('100000.00'),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create customer user
      await userRepository.create({
        id: customerUserId,
        email: 'customer@example.com',
        passwordHash: 'hash',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        cashBalance: new Decimal('50000.00'),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // [AC-02] Admin updates user role and creates audit log
    it('[AC-02] should update user role from CUSTOMER to SUSPENDED', async () => {
      const result = await userAdminService.updateUserRole(customerUserId, adminUserId, {
        role: UserRole.SUSPENDED,
        reason: 'Compliance review'
      });

      expect(result.role).toBe(UserRole.SUSPENDED);
      expect(result.id).toBe(customerUserId);
    });

    // [AC-02] Audit log entry creation
    it('[AC-02] should create audit log entry with all required fields', async () => {
      await userAdminService.updateUserRole(customerUserId, adminUserId, {
        role: UserRole.SUSPENDED,
        reason: 'Compliance review'
      });

      const logs = await auditLogRepository.getAll();
      expect(logs).toHaveLength(1);

      const auditLog = logs[0];
      expect(auditLog.auditId).toBeDefined();
      expect(auditLog.targetUserId).toBe(customerUserId);
      expect(auditLog.previousRole).toBe(UserRole.CUSTOMER);
      expect(auditLog.newRole).toBe(UserRole.SUSPENDED);
      expect(auditLog.actorUserId).toBe(adminUserId);
      expect(auditLog.timestamp).toBeInstanceOf(Date);
      expect(auditLog.reason).toBe('Compliance review');
    });

    // [AC-02] Audit log timestamp in UTC ISO-8601 format
    it('[AC-02] should store audit log timestamp in UTC ISO-8601 format', async () => {
      const beforeTime = new Date();
      await userAdminService.updateUserRole(customerUserId, adminUserId, {
        role: UserRole.SUSPENDED
      });
      const afterTime = new Date();

      const logs = await auditLogRepository.getAll();
      const timestamp = logs[0].timestamp;

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('[AC-02] should update user role from CUSTOMER to ADMIN', async () => {
      const result = await userAdminService.updateUserRole(customerUserId, adminUserId, {
        role: UserRole.ADMIN,
        reason: 'Promotion'
      });

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('[AC-02] should throw error when updating user to same role', async () => {
      await expect(userAdminService.updateUserRole(customerUserId, adminUserId, {
        role: UserRole.CUSTOMER
      })).rejects.toThrow(InvalidUserStateException);
    });

    it('[AC-02] should throw error when user does not exist', async () => {
      const nonExistentUserId = uuidv4();

      await expect(userAdminService.updateUserRole(nonExistentUserId, adminUserId, {
        role: UserRole.ADMIN
      })).rejects.toThrow(UserNotFoundException);
    });

    it('[AC-02] should not create audit log when update fails', async () => {
      const nonExistentUserId = uuidv4();

      try {
        await userAdminService.updateUserRole(nonExistentUserId, adminUserId, {
          role: UserRole.ADMIN
        });
      } catch (error) {
        // Expected to fail
      }

      const logs = await auditLogRepository.getAll();
      expect(logs).toHaveLength(0);
    });
  });

  describe('getAuditLogs', () => {
    it('[AC-02] should return audit logs with pagination', async () => {
      const adminUserId = uuidv4();
      const customerUserId = uuidv4();

      // Create users
      await userRepository.create({
        id: adminUserId,
        email: 'admin@example.com',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        cashBalance: new Decimal('100000.00'),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await userRepository.create({
        id: customerUserId,
        email: 'customer@example.com',
        passwordHash: 'hash',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        cashBalance: new Decimal('50000.00'),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create multiple audit logs
      await userAdminService.updateUserRole(customerUserId, adminUserId, {
        role: UserRole.SUSPENDED
      });

      await userAdminService.updateUserRole(customerUserId, adminUserId, {
        role: UserRole.CUSTOMER
      });

      const logs = await userAdminService.getAuditLogs(10, 0);
      expect(logs).toHaveLength(2);
      expect(logs[0].targetUserId).toBe(customerUserId);
      expect(logs[1].targetUserId).toBe(customerUserId);
    });

    it('[AC-02] should return audit logs in ISO-8601 format', async () => {
      const adminUserId = uuidv4();
      const customerUserId = uuidv4();

      await userRepository.create({
        id: adminUserId,
        email: 'admin@example.com',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        cashBalance: new Decimal('100000.00'),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await userRepository.create({
        id: customerUserId,
        email: 'customer@example.com',
        passwordHash: 'hash',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        cashBalance: new Decimal('50000.00'),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await userAdminService.updateUserRole(customerUserId, adminUserId, {
        role: UserRole.SUSPENDED
      });

      const logs = await userAdminService.getAuditLogs(10, 0);
      expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
