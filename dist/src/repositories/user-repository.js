"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
class UserRepository {
    usersStore;
    constructor() {
        this.usersStore = new Map();
    }
    async create(user) {
        if (this.usersStore.has(user.id)) {
            throw new Error(`User with ID ${user.id} already exists`);
        }
        this.usersStore.set(user.id, { ...user });
        return this.usersStore.get(user.id);
    }
    async findById(userId) {
        return this.usersStore.get(userId) || null;
    }
    async findByEmail(email) {
        for (const user of this.usersStore.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }
    async updateRole(userId, role) {
        const user = this.usersStore.get(userId);
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }
        user.role = role;
        user.updatedAt = new Date();
        return user;
    }
    async findAll(limit = 100, offset = 0) {
        const users = Array.from(this.usersStore.values());
        return users.slice(offset, offset + limit);
    }
    async clear() {
        this.usersStore.clear();
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=user-repository.js.map