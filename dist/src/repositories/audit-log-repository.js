"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogRepository = void 0;
class AuditLogRepository {
    auditLogsStore;
    constructor() {
        this.auditLogsStore = [];
    }
    async log(entry) {
        this.auditLogsStore.push({ ...entry });
        return entry;
    }
    async getAll(limit = 100, offset = 0) {
        return this.auditLogsStore.slice(offset, offset + limit);
    }
    async clear() {
        this.auditLogsStore.length = 0;
    }
}
exports.AuditLogRepository = AuditLogRepository;
//# sourceMappingURL=audit-log-repository.js.map