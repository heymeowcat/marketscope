import { Router, Response } from 'express';
import { AnalyticsService } from '../services/analytics-service';
import { AuthenticatedRequest, parseJwt, requireRole } from './middleware';
import { UserRole } from '../domain/user';

export interface AnalyticsControllerDeps {
  analyticsService: AnalyticsService;
}

export class AnalyticsController {
  private router: Router;
  private analyticsService: AnalyticsService;

  constructor(deps: AnalyticsControllerDeps) {
    this.analyticsService = deps.analyticsService;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get(
      '/daily-stats',
      parseJwt,
      requireRole(UserRole.CUSTOMER, UserRole.ADMIN),
      this.getDailyStats.bind(this)
    );
  }

  private async getDailyStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customerId = req.user?.user_id || req.user?.userId;
      if (!customerId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing user ID'
          }
        });
        return;
      }

      const stats = await this.analyticsService.getDailyStats(customerId);

      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve daily stats'
        }
      });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
