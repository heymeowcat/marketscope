import { Router, Response } from 'express';
import { PortfolioService } from '../services/portfolio-service';
import { AuthenticatedRequest, parseJwt, requireRole } from './middleware';
import { UserRole } from '../domain/user';

export interface PortfolioControllerDeps {
  portfolioService: PortfolioService;
  userRepository: any;
}

export class PortfolioController {
  private router: Router;
  private portfolioService: PortfolioService;
  private userRepository: any;

  constructor(deps: PortfolioControllerDeps) {
    this.portfolioService = deps.portfolioService;
    this.userRepository = deps.userRepository;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get(
      '/stats',
      parseJwt,
      requireRole(UserRole.CUSTOMER, UserRole.ADMIN),
      this.getStats.bind(this)
    );
    this.router.get(
      '/holdings',
      parseJwt,
      requireRole(UserRole.CUSTOMER, UserRole.ADMIN),
      this.getHoldings.bind(this)
    );
    this.router.get(
      '/summary',
      parseJwt,
      requireRole(UserRole.CUSTOMER, UserRole.ADMIN),
      this.getSummary.bind(this)
    );
  }

  private async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customerId = req.user?.user_id || req.user?.userId;
      if (!customerId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing user ID' } });
        return;
      }

      const stats = await this.portfolioService.getStats(customerId);

      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve portfolio stats'
        }
      });
    }
  }

  private async getHoldings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customerId = req.user?.user_id || req.user?.userId;
      if (!customerId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing user ID' } });
        return;
      }

      const holdingsResponse = await this.portfolioService.getHoldings(customerId);

      res.status(200).json(holdingsResponse);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve holdings'
        }
      });
    }
  }

  private async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customerId = req.user?.user_id || req.user?.userId;
      if (!customerId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing user ID' } });
        return;
      }
      const user = await this.userRepository.findById(customerId);

      if (!user) {
        res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }

      const summary = await this.portfolioService.getSummary(customerId, user.cashBalance);

      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve portfolio summary'
        }
      });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
