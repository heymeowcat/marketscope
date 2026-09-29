import { v4 as uuidv4 } from 'uuid';
import { WatchlistEntity } from '../domain/watchlist';
import { WatchlistLimitRule } from '../domain/watchlist-limit-rule';
import {
  WatchlistLimitExceededException,
  WatchlistUpdateException,
  WatchlistNotFoundException
} from '../domain/exceptions';
import { IWatchlistRepository } from '../repositories/watchlist-repository';
import { IWatchlistSymbolRepository } from '../repositories/watchlist-symbol-repository';
import { IStockRepository } from '../repositories/stock-repository';

export interface WatchlistServiceDeps {
  watchlistRepository: IWatchlistRepository;
  watchlistSymbolRepository: IWatchlistSymbolRepository;
  stockRepository: IStockRepository;
}

export interface WatchlistResponse {
  watchlist_id: string;
  customer_id: string;
  name: string;
  symbols: string[];
  created_at: string;
}

export class WatchlistService {
  private watchlistRepository: IWatchlistRepository;
  private watchlistSymbolRepository: IWatchlistSymbolRepository;
  private stockRepository: IStockRepository;
  private limitRule: WatchlistLimitRule;

  constructor(deps: WatchlistServiceDeps) {
    this.watchlistRepository = deps.watchlistRepository;
    this.watchlistSymbolRepository = deps.watchlistSymbolRepository;
    this.stockRepository = deps.stockRepository;
    this.limitRule = new WatchlistLimitRule();
  }

  async create(
    customerId: string,
    name: string,
    symbols: string[]
  ): Promise<WatchlistEntity> {
    // Validate symbols array is not empty
    if (!symbols || symbols.length === 0) {
      throw new WatchlistUpdateException('Watchlist must contain at least one symbol');
    }

    // Check watchlist limit
    const count = await this.watchlistRepository.countByCustomerId(customerId);
    this.limitRule.enforce(customerId, count);

    // Validate all symbols exist in stock catalog
    for (const symbol of symbols) {
      const stock = await this.stockRepository.findBySymbolActive(symbol);
      if (!stock) {
        throw new WatchlistUpdateException(`Symbol ${symbol} does not exist in catalog`);
      }
    }

    // Create watchlist within transaction
    const watchlistId = uuidv4();
    const now = new Date();

    const watchlist: WatchlistEntity = {
      watchlist_id: watchlistId,
      customer_id: customerId,
      name,
      symbols: [...symbols],
      created_at: now
    };

    const created = await this.watchlistRepository.create(watchlist);
    return created;
  }

  async update(
    watchlistId: string,
    name?: string,
    symbols?: string[]
  ): Promise<WatchlistEntity> {
    // Get current watchlist
    const current = await this.watchlistRepository.findById(watchlistId);
    if (!current) {
      throw new WatchlistNotFoundException(watchlistId);
    }

    // Validate new symbols if provided
    if (symbols) {
      if (symbols.length === 0) {
        throw new WatchlistUpdateException('Watchlist must contain at least one symbol');
      }

      // Validate all symbols exist (this is atomic - if any fail, entire update fails)
      for (const symbol of symbols) {
        const stock = await this.stockRepository.findBySymbolActive(symbol);
        if (!stock) {
          throw new WatchlistUpdateException(`Symbol ${symbol} does not exist in catalog`);
        }
      }
    }

    // Perform atomic update: update both name and symbols
    const updates: Partial<WatchlistEntity> = {};
    if (name !== undefined) {
      updates.name = name;
    }
    if (symbols !== undefined) {
      updates.symbols = [...symbols];
    }

    try {
      const updated = await this.watchlistRepository.update(watchlistId, updates);
      return updated;
    } catch (error) {
      throw new WatchlistUpdateException(
        `Watchlist atomic update failed: ${(error as Error).message}`
      );
    }
  }

  async delete(watchlistId: string): Promise<void> {
    const watchlist = await this.watchlistRepository.findById(watchlistId);
    if (!watchlist) {
      throw new WatchlistNotFoundException(watchlistId);
    }

    // Atomic delete
    await this.watchlistRepository.delete(watchlistId);
    await this.watchlistSymbolRepository.deleteByWatchlistId(watchlistId);
  }

  async getById(watchlistId: string): Promise<WatchlistEntity> {
    const watchlist = await this.watchlistRepository.findById(watchlistId);
    if (!watchlist) {
      throw new WatchlistNotFoundException(watchlistId);
    }
    return watchlist;
  }

  async getByCustomerId(customerId: string): Promise<WatchlistEntity[]> {
    return this.watchlistRepository.findByCustomerId(customerId);
  }

  toResponse(watchlist: WatchlistEntity): WatchlistResponse {
    return {
      watchlist_id: watchlist.watchlist_id,
      customer_id: watchlist.customer_id,
      name: watchlist.name,
      symbols: watchlist.symbols,
      created_at: watchlist.created_at.toISOString()
    };
  }
}
