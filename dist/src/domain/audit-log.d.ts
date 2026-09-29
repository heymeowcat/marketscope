import { UserRole } from './user';
export interface AuditLogEntity {
    auditId: string;
    targetUserId: string;
    previousRole: UserRole;
    newRole: UserRole;
    actorUserId: string;
    timestamp: Date;
    reason?: string;
}
export declare class AuditLog implements AuditLogEntity {
    auditId: string;
    targetUserId: string;
    previousRole: UserRole;
    newRole: UserRole;
    actorUserId: string;
    timestamp: Date;
    reason?: string;
    constructor(props: AuditLogEntity);
}
