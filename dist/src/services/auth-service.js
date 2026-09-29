"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const uuid_1 = require("uuid");
const user_1 = require("../domain/user");
const exceptions_1 = require("../domain/exceptions");
const BCRYPT_SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const INITIAL_CASH_BALANCE = new decimal_js_1.default('100000.00');
class AuthService {
    userRepository;
    constructor(deps) {
        this.userRepository = deps.userRepository;
    }
    async register(request) {
        // Check if email already exists
        const existingUser = await this.userRepository.findByEmail(request.email);
        if (existingUser) {
            throw new exceptions_1.DuplicateEmailException(request.email);
        }
        // Validate password strength
        this.validatePasswordStrength(request.password);
        // Hash password
        const passwordHash = await this.hashPassword(request.password);
        // Create new user
        const userId = (0, uuid_1.v4)();
        const now = new Date();
        const newUser = {
            id: userId,
            email: request.email,
            passwordHash,
            role: user_1.UserRole.CUSTOMER,
            status: user_1.UserStatus.ACTIVE,
            cashBalance: INITIAL_CASH_BALANCE,
            createdAt: now,
            updatedAt: now
        };
        const createdUser = await this.userRepository.create(newUser);
        const token = this.generateToken(createdUser);
        return {
            token,
            user: {
                id: createdUser.id,
                email: createdUser.email,
                role: createdUser.role,
                status: createdUser.status,
                cashBalance: createdUser.cashBalance.toString()
            }
        };
    }
    async login(request) {
        // Find user by email
        const user = await this.userRepository.findByEmail(request.email);
        if (!user) {
            throw new exceptions_1.UserNotFoundException('User with this email not found');
        }
        // Verify password
        const isPasswordValid = await this.validatePassword(request.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new exceptions_1.InvalidPasswordException('Invalid email or password');
        }
        const token = this.generateToken(user);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                cashBalance: user.cashBalance.toString()
            }
        };
    }
    async hashPassword(password) {
        return bcryptjs_1.default.hash(password, BCRYPT_SALT_ROUNDS);
    }
    async validatePassword(plainPassword, hash) {
        return bcryptjs_1.default.compare(plainPassword, hash);
    }
    validatePasswordStrength(password) {
        if (password.length < 8) {
            throw new exceptions_1.InvalidPasswordException('Password must be at least 8 characters');
        }
    }
    generateToken(user) {
        return jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role
        }, JWT_SECRET, { expiresIn: '24h' });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth-service.js.map