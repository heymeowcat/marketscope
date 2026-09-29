import Decimal from 'decimal.js';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SUSPENDED = 'SUSPENDED'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  cashBalance: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export interface UpdateUserRoleInput {
  role: UserRole;
  reason?: string;
}

export class User implements UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  cashBalance: Decimal;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: UserEntity) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.status = props.status;
    this.cashBalance = props.cashBalance instanceof Decimal
      ? props.cashBalance
      : new Decimal(props.cashBalance);
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
