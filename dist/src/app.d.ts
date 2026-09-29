import { Express } from 'express';
import { UserRepository, IUserRepository } from './repositories/user-repository';
import { AuditLogRepository, IAuditLogRepository } from './repositories/audit-log-repository';
import { AuthService } from './services/auth-service';
import { UserAdminService } from './services/user-admin-service';
export interface AppDeps {
    userRepository?: IUserRepository;
    auditLogRepository?: IAuditLogRepository;
}
export declare function createApp(deps?: AppDeps): Express;
export { UserRepository, AuditLogRepository, AuthService, UserAdminService };
