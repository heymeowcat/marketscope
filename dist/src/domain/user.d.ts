import Decimal from 'decimal.js';
export declare enum UserRole {
    CUSTOMER = "CUSTOMER",
    ADMIN = "ADMIN",
    SUSPENDED = "SUSPENDED"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
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
export declare class User implements UserEntity {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    cashBalance: Decimal;
    createdAt: Date;
    updatedAt: Date;
    constructor(props: UserEntity);
}
