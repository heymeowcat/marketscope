import { UserRole, UserEntity } from '../domain/user';
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
export declare class UserAdminService {
    private userRepository;
    private auditLogRepository;
    constructor(deps: UserAdminServiceDeps);
    updateUserRole(targetUserId: string, actorUserId: string, request: UpdateRoleRequest): Promise<UserEntity>;
    getAuditLogs(limit?: number, offset?: number): Promise<AuditLogResponse[]>;
}
