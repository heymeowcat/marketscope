import { Router, Response } from 'express';
import { UserAdminService } from '../services/user-admin-service';
import { UserRole } from '../domain/user';
import {
  UserNotFoundException,
  InvalidUserStateException,
  RoleAccessDeniedException
} from '../domain/exceptions';
import { AuthenticatedRequest, parseJwt, requireRole } from './middleware';

export interface UserAdminControllerDeps {
  userAdminService: UserAdminService;
}

export class UserAdminController {
  private router: Router;
  private userAdminService: UserAdminService;

  constructor(deps: UserAdminControllerDeps) {
    this.userAdminService = deps.userAdminService;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/users', parseJwt, requireRole(UserRole.ADMIN), this.listUsers.bind(this));
    this.router.patch(
      '/users/:id/role',
      parseJwt,
      requireRole(UserRole.ADMIN),
      this.updateUserRole.bind(this)
    );
    this.router.get('/audit-logs', parseJwt, requireRole(UserRole.ADMIN), this.getAuditLogs.bind(this));
  }

  private async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      // In a real implementation, this would call userRepository
      // For now, we return empty list
      res.status(200).json({
        users: [],
        limit,
        offset
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as Error).message || 'An unexpected error occurred'
        }
      });
    }
  }

  private async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { id } = req.params;
      const { role, reason } = req.body;

      if (!id || !role) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'User ID and role are required'
          }
        });
        return;
      }

      // Validate role value
      if (!Object.values(UserRole).includes(role)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`
          }
        });
        return;
      }

      const updatedUser = await this.userAdminService.updateUserRole(id, req.user.userId, {
        role,
        reason
      });

      res.status(200).json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          cashBalance: updatedUser.cashBalance.toString()
        }
      });
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        res.status(404).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      if (error instanceof InvalidUserStateException) {
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

  private async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const logs = await this.userAdminService.getAuditLogs(limit, offset);
      res.status(200).json({
        auditLogs: logs,
        limit,
        offset
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as Error).message || 'An unexpected error occurred'
        }
      });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
