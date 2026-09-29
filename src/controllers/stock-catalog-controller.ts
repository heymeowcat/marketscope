import { Router, Response } from 'express';
import { StockCatalogService } from '../services/stock-catalog-service';
import { StockNotFoundException } from '../domain/exceptions';
import { AuthenticatedRequest, parseJwt } from './middleware';

export interface StockCatalogControllerDeps {
  stockCatalogService: StockCatalogService;
}

export class StockCatalogController {
  private router: Router;
  private stockCatalogService: StockCatalogService;

  constructor(deps: StockCatalogControllerDeps) {
    this.stockCatalogService = deps.stockCatalogService;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/stocks', this.searchStocks.bind(this));
    this.router.get('/stocks/:symbol', this.getStock.bind(this));
  }

  private async searchStocks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const sector = req.query.sector as string | undefined;
      const exchange = req.query.exchange as string | undefined;
      const search = req.query.search as string | undefined;

      const stocks = await this.stockCatalogService.searchStocks({
        sector,
        exchange,
        search,
        limit,
        offset
      });

      res.status(200).json({
        stocks: stocks.map(s => this.stockCatalogService.toResponse(s)),
        count: stocks.length,
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

  private async getStock(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const stock = await this.stockCatalogService.getStockBySymbol(symbol);

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

  getRouter(): Router {
    return this.router;
  }
}
