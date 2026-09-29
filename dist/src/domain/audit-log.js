"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
class AuditLog {
    auditId;
    targetUserId;
    previousRole;
    newRole;
    actorUserId;
    timestamp;
    reason;
    constructor(props) {
        this.auditId = props.auditId;
        this.targetUserId = props.targetUserId;
        this.previousRole = props.previousRole;
        this.newRole = props.newRole;
        this.actorUserId = props.actorUserId;
        this.timestamp = props.timestamp;
        this.reason = props.reason;
    }
}
exports.AuditLog = AuditLog;
//# sourceMappingURL=audit-log.js.map