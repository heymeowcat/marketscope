import { Router, Response } from 'express';
import { AuthService } from '../services/auth-service';
import { DuplicateEmailException, InvalidPasswordException } from '../domain/exceptions';
import { AuthenticatedRequest, parseJwt } from './middleware';

export interface AuthControllerDeps {
  authService: AuthService;
}

export class AuthController {
  private router: Router;
  private authService: AuthService;

  constructor(deps: AuthControllerDeps) {
    this.authService = deps.authService;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/register', this.register.bind(this));
    this.router.post('/login', this.login.bind(this));
    this.router.get('/me', parseJwt, this.getCurrentUser.bind(this));
  }

  private async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required'
          }
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format'
          }
        });
        return;
      }

      const result = await this.authService.register({ email, password });
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof DuplicateEmailException) {
        res.status(409).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      if (error instanceof InvalidPasswordException) {
        res.status(400).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as Error).message || 'An unexpected error occurred'
        }
      });
    }
  }

  private async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required'
          }
        });
        return;
      }

      const result = await this.authService.login({ email, password });
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidPasswordException) {
        res.status(401).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as Error).message || 'An unexpected error occurred'
        }
      });
    }
  }

  private getCurrentUser(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }

    res.status(200).json({
      user: req.user
    });
  }

  getRouter(): Router {
    return this.router;
  }
}
