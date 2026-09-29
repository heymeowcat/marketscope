import { v4 as uuidv4 } from 'uuid';
import { UserRole, UserEntity } from '../domain/user';
import { AuditLogEntity } from '../domain/audit-log';
import { UserNotFoundException, InvalidUserStateException } from '../domain/exceptions';
import { IUserRepository } from '../repositories/user-repository';
import { IAuditLogRepository } from '../repositories/audit-log-repository';

export interface UserAdminServiceDeps {
  userRepository: IUserRepository;
  auditLogRepository: IAuditLogRepository;
}

export interface UpdateRoleRequest {
  role: UserRole;
  reason?: string;
}

export interface AuditLogResponse {
  auditId: string;
  targetUserId: string;
  previousRole: UserRole;
  newRole: UserRole;
  actorUserId: string;
  timestamp: string;
  reason?: string;
}

export class UserAdminService {
  private userRepository: IUserRepository;
  private auditLogRepository: IAuditLogRepository;

  constructor(deps: UserAdminServiceDeps) {
    this.userRepository = deps.userRepository;
    this.auditLogRepository = deps.auditLogRepository;
  }

  async updateUserRole(
    targetUserId: string,
    actorUserId: string,
    request: UpdateRoleRequest
  ): Promise<UserEntity> {
    // Fetch target user
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new UserNotFoundException(targetUserId);
    }

    // Validate role transition
    const previousRole = targetUser.role;
    if (previousRole === request.role) {
      throw new InvalidUserStateException(`User is already in ${request.role} role`);
    }

    // Update user role
    const updatedUser = await this.userRepository.updateRole(targetUserId, request.role);

    // Create audit log entry
    const auditEntry: AuditLogEntity = {
      auditId: uuidv4(),
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

  async getAuditLogs(limit: number = 100, offset: number = 0): Promise<AuditLogResponse[]> {
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
