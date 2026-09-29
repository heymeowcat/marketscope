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

export class AuditLog implements AuditLogEntity {
  auditId: string;
  targetUserId: string;
  previousRole: UserRole;
  newRole: UserRole;
  actorUserId: string;
  timestamp: Date;
  reason?: string;

  constructor(props: AuditLogEntity) {
    this.auditId = props.auditId;
    this.targetUserId = props.targetUserId;
    this.previousRole = props.previousRole;
    this.newRole = props.newRole;
    this.actorUserId = props.actorUserId;
    this.timestamp = props.timestamp;
    this.reason = props.reason;
  }
}
