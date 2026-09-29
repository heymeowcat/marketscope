import { UserRole, UserStatus } from '../domain/user';
import { IUserRepository } from '../repositories/user-repository';
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
export declare class AuthService {
    private userRepository;
    constructor(deps: AuthServiceDeps);
    register(request: RegisterRequest): Promise<AuthResponse>;
    login(request: LoginRequest): Promise<AuthResponse>;
    hashPassword(password: string): Promise<string>;
    validatePassword(plainPassword: string, hash: string): Promise<boolean>;
    private validatePasswordStrength;
    private generateToken;
}
