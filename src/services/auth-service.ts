import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import { User, UserEntity, UserRole, UserStatus } from '../domain/user';
import {
  DuplicateEmailException,
  InvalidPasswordException,
  UserNotFoundException
} from '../domain/exceptions';
import { IUserRepository } from '../repositories/user-repository';

const BCRYPT_SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const INITIAL_CASH_BALANCE = new Decimal('100000.00');

export interface AuthServiceDeps {
  userRepository: IUserRepository;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    cashBalance: string;
  };
}

export class AuthService {
  private userRepository: IUserRepository;

  constructor(deps: AuthServiceDeps) {
    this.userRepository = deps.userRepository;
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new DuplicateEmailException(request.email);
    }

    // Validate password strength
    this.validatePasswordStrength(request.password);

    // Hash password
    const passwordHash = await this.hashPassword(request.password);

    // Create new user
    const userId = uuidv4();
    const now = new Date();
    const newUser: UserEntity = {
      id: userId,
      email: request.email,
      passwordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
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

  async login(request: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new UserNotFoundException('User with this email not found');
    }

    // Verify password
    const isPasswordValid = await this.validatePassword(request.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidPasswordException('Invalid email or password');
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

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  async validatePassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new InvalidPasswordException('Password must be at least 8 characters');
    }
  }

  private generateToken(user: UserEntity): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}
