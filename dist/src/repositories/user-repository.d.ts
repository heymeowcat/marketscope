import { UserEntity, UserRole } from '../domain/user';
export interface IUserRepository {
    create(user: UserEntity): Promise<UserEntity>;
    findById(userId: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    updateRole(userId: string, role: UserRole): Promise<UserEntity>;
    findAll(limit?: number, offset?: number): Promise<UserEntity[]>;
    clear?(): Promise<void>;
}
export declare class UserRepository implements IUserRepository {
    private usersStore;
    constructor();
    create(user: UserEntity): Promise<UserEntity>;
    findById(userId: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    updateRole(userId: string, role: UserRole): Promise<UserEntity>;
    findAll(limit?: number, offset?: number): Promise<UserEntity[]>;
    clear(): Promise<void>;
}
