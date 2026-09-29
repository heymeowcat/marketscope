import { AuditLogEntity } from '../domain/audit-log';

export interface IAuditLogRepository {
  log(entry: AuditLogEntity): Promise<AuditLogEntity>;
  getAll(limit?: number, offset?: number): Promise<AuditLogEntity[]>;
  clear?(): Promise<void>;
}

export class AuditLogRepository implements IAuditLogRepository {
  private auditLogsStore: AuditLogEntity[];

  constructor() {
    this.auditLogsStore = [];
  }

  async log(entry: AuditLogEntity): Promise<AuditLogEntity> {
    this.auditLogsStore.push({ ...entry });
    return entry;
  }

  async getAll(limit: number = 100, offset: number = 0): Promise<AuditLogEntity[]> {
    return this.auditLogsStore.slice(offset, offset + limit);
  }

  async clear(): Promise<void> {
    this.auditLogsStore.length = 0;
  }
}
