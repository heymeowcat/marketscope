import { Router, Response } from 'express';
import { StockCatalogService } from '../services/stock-catalog-service';
import { UserRole } from '../domain/user';
import { StockAlreadyExistsException, StockNotFoundException } from '../domain/exceptions';
import { AuthenticatedRequest, parseJwt, requireRole } from './middleware';

export interface StockAdminControllerDeps {
  stockCatalogService: StockCatalogService;
}

export class StockAdminController {
  private router: Router;
  private stockCatalogService: StockCatalogService;

  constructor(deps: StockAdminControllerDeps) {
    this.stockCatalogService = deps.stockCatalogService;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/', parseJwt, requireRole(UserRole.ADMIN), this.createStock.bind(this));
    this.router.put('/:symbol', parseJwt, requireRole(UserRole.ADMIN), this.updateStock.bind(this));
    this.router.delete('/:symbol', parseJwt, requireRole(UserRole.ADMIN), this.deleteStock.bind(this));
  }

  private async createStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { symbol, company_name, sector, exchange, initial_price } = req.body;

      // Validation
      if (!symbol || !company_name || !sector || !exchange || !initial_price) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'symbol, company_name, sector, exchange, and initial_price are required'
          }
        });
        return;
      }

      // Validate price is a valid number string
      try {
        parseFloat(initial_price);
      } catch {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'initial_price must be a valid number'
          }
        });
        return;
      }

      const stock = await this.stockCatalogService.createStock({
        symbol,
        company_name,
        sector,
        exchange,
        initial_price
      });

      res.status(201).json({
        stock: this.stockCatalogService.toResponse(stock)
      });
    } catch (error) {
      if (error instanceof StockAlreadyExistsException) {
        res.status(409).json({
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

  private async updateStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const { company_name, sector, exchange } = req.body;

      if (!symbol) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Symbol is required'
          }
        });
        return;
      }

      // At least one field to update
      if (!company_name && !sector && !exchange) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one field (company_name, sector, exchange) must be provided'
          }
        });
        return;
      }

      const stock = await this.stockCatalogService.updateStock(symbol, {
        company_name,
        sector,
        exchange
      });

      res.status(200).json({
        stock: this.stockCatalogService.toResponse(stock)
      });
    } catch (error) {
      if (error instanceof StockNotFoundException) {
        res.status(404).json({
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

  private async deleteStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Symbol is required'
          }
        });
        return;
      }

      await this.stockCatalogService.softDeleteStock(symbol);

      res.status(200).json({
        message: 'Stock delisted successfully',
        status: 'DELISTED'
      });
    } catch (error) {
      if (error instanceof StockNotFoundException) {
        res.status(404).json({
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

  getRouter(): Router {
    return this.router;
  }
}
