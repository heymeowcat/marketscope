"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAdminService = void 0;
const uuid_1 = require("uuid");
const exceptions_1 = require("../domain/exceptions");
class UserAdminService {
    userRepository;
    auditLogRepository;
    constructor(deps) {
        this.userRepository = deps.userRepository;
        this.auditLogRepository = deps.auditLogRepository;
    }
    async updateUserRole(targetUserId, actorUserId, request) {
        // Fetch target user
        const targetUser = await this.userRepository.findById(targetUserId);
        if (!targetUser) {
            throw new exceptions_1.UserNotFoundException(targetUserId);
        }
        // Validate role transition
        const previousRole = targetUser.role;
        if (previousRole === request.role) {
            throw new exceptions_1.InvalidUserStateException(`User is already in ${request.role} role`);
        }
        // Update user role
        const updatedUser = await this.userRepository.updateRole(targetUserId, request.role);
        // Create audit log entry
        const auditEntry = {
            auditId: (0, uuid_1.v4)(),
            targetUserId,
            previousRole,
            newRole: request.role,
            actorUserId,
            timestamp: new Date(),
            reason: request.reason
        };
        await this.auditLogRepository.log(auditEntry);
        return updatedUser;
    }
    async getAuditLogs(limit = 100, offset = 0) {
        const logs = await this.auditLogRepository.getAll(limit, offset);
        return logs.map(log => ({
            auditId: log.auditId,
            targetUserId: log.targetUserId,
            previousRole: log.previousRole,
            newRole: log.newRole,
            actorUserId: log.actorUserId,
            timestamp: log.timestamp.toISOString(),
            reason: log.reason
        }));
    }
}
exports.UserAdminService = UserAdminService;
//# sourceMappingURL=user-admin-service.js.map