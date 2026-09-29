import { Router, Response } from 'express';
import { WatchlistService } from '../services/watchlist-service';
import {
  WatchlistLimitExceededException,
  WatchlistUpdateException,
  WatchlistNotFoundException
} from '../domain/exceptions';
import { AuthenticatedRequest, parseJwt } from './middleware';

export interface WatchlistControllerDeps {
  watchlistService: WatchlistService;
}

export class WatchlistController {
  private router: Router;
  private watchlistService: WatchlistService;

  constructor(deps: WatchlistControllerDeps) {
    this.watchlistService = deps.watchlistService;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/', parseJwt, this.listWatchlists.bind(this));
    this.router.get('/:id', parseJwt, this.getWatchlist.bind(this));
    this.router.post('/', parseJwt, this.createWatchlist.bind(this));
    this.router.put('/:id', parseJwt, this.updateWatchlist.bind(this));
    this.router.delete('/:id', parseJwt, this.deleteWatchlist.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  private async listWatchlists(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customerId = req.user?.user_id || req.user?.userId;
      if (!customerId) {
        res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
        return;
      }

      const watchlists = await this.watchlistService.getByCustomerId(customerId);
      res.status(200).json({
        watchlists: watchlists.map(w => this.watchlistService.toResponse(w))
      });
    } catch (error) {
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message || 'An unexpected error occurred'
      });
    }
  }

  private async getWatchlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Watchlist ID is required'
        });
        return;
      }

      const watchlist = await this.watchlistService.getById(id);
      res.status(200).json({
        watchlist: this.watchlistService.toResponse(watchlist)
      });
    } catch (error) {
      if (error instanceof WatchlistNotFoundException) {
        res.status(404).json({
          error: error.code,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message || 'An unexpected error occurred'
      });
    }
  }

  private async createWatchlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customerId = req.user?.user_id || req.user?.userId;
      if (!customerId) {
        res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
        return;
      }

      const { name, symbols } = req.body;

      // Validate input
      if (!name || typeof name !== 'string') {
        res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: 'Name is required and must be a string'
        });
        return;
      }

      if (!Array.isArray(symbols) || symbols.length === 0) {
        res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: 'Watchlist must contain at least one symbol'
        });
        return;
      }

      const watchlist = await this.watchlistService.create(customerId, name, symbols);
      res.status(201).json({
        watchlist: this.watchlistService.toResponse(watchlist)
      });
    } catch (error) {
      if (error instanceof WatchlistLimitExceededException) {
        res.status(400).json({
          error: error.code,
          message: error.message
        });
        return;
      }

      if (error instanceof WatchlistUpdateException) {
        res.status(422).json({
          error: error.code,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message || 'An unexpected error occurred'
      });
    }
  }

  private async updateWatchlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, symbols } = req.body;

      if (!id) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Watchlist ID is required'
        });
        return;
      }

      // Validate input
      if (symbols !== undefined && (!Array.isArray(symbols) || symbols.length === 0)) {
        res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: 'Symbols must be a non-empty array'
        });
        return;
      }

      const watchlist = await this.watchlistService.update(id, name, symbols);
      res.status(200).json({
        watchlist: this.watchlistService.toResponse(watchlist)
      });
    } catch (error) {
      if (error instanceof WatchlistNotFoundException) {
        res.status(404).json({
          error: error.code,
          message: error.message
        });
        return;
      }

      if (error instanceof WatchlistUpdateException) {
        res.status(422).json({
          error: error.code,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message || 'An unexpected error occurred'
      });
    }
  }

  private async deleteWatchlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Watchlist ID is required'
        });
        return;
      }

      await this.watchlistService.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof WatchlistNotFoundException) {
        res.status(404).json({
          error: error.code,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message || 'An unexpected error occurred'
      });
    }
  }
}
