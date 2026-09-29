import Decimal from 'decimal.js';
import { UserEntity, UserRole, UserStatus } from '../domain/user';

export interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findById(userId: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  updateRole(userId: string, role: UserRole): Promise<UserEntity>;
  findAll(limit?: number, offset?: number): Promise<UserEntity[]>;
  clear?(): Promise<void>;
}

export class UserRepository implements IUserRepository {
  private usersStore: Map<string, UserEntity>;

  constructor() {
    this.usersStore = new Map();
  }

  async create(user: UserEntity): Promise<UserEntity> {
    if (this.usersStore.has(user.id)) {
      throw new Error(`User with ID ${user.id} already exists`);
    }
    this.usersStore.set(user.id, { ...user });
    return this.usersStore.get(user.id)!;
  }

  async findById(userId: string): Promise<UserEntity | null> {
    return this.usersStore.get(userId) || null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.usersStore.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateRole(userId: string, role: UserRole): Promise<UserEntity> {
    const user = this.usersStore.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    user.role = role;
    user.updatedAt = new Date();
    return user;
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<UserEntity[]> {
    const users = Array.from(this.usersStore.values());
    return users.slice(offset, offset + limit);
  }

  async clear(): Promise<void> {
    this.usersStore.clear();
  }
}
