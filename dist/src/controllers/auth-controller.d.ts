import { Router } from 'express';
import { AuthService } from '../services/auth-service';
export interface AuthControllerDeps {
    authService: AuthService;
}
export declare class AuthController {
    private router;
    private authService;
    constructor(deps: AuthControllerDeps);
    private setupRoutes;
    private register;
    private login;
    private getCurrentUser;
    getRouter(): Router;
}
