import { AuditLogEntity } from '../domain/audit-log';
export interface IAuditLogRepository {
    log(entry: AuditLogEntity): Promise<AuditLogEntity>;
    getAll(limit?: number, offset?: number): Promise<AuditLogEntity[]>;
    clear?(): Promise<void>;
}
export declare class AuditLogRepository implements IAuditLogRepository {
    private auditLogsStore;
    constructor();
    log(entry: AuditLogEntity): Promise<AuditLogEntity>;
    getAll(limit?: number, offset?: number): Promise<AuditLogEntity[]>;
    clear(): Promise<void>;
}
