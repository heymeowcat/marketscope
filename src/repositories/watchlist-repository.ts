import { WatchlistEntity, Watchlist } from '../domain/watchlist';

export interface IWatchlistRepository {
  create(watchlist: WatchlistEntity): Promise<WatchlistEntity>;
  findById(watchlistId: string): Promise<WatchlistEntity | null>;
  findByCustomerId(customerId: string): Promise<WatchlistEntity[]>;
  update(watchlistId: string, updates: Partial<WatchlistEntity>): Promise<WatchlistEntity>;
  delete(watchlistId: string): Promise<void>;
  countByCustomerId(customerId: string): Promise<number>;
  clear?(): Promise<void>;
}

export class WatchlistRepository implements IWatchlistRepository {
  private watchlistsStore: Map<string, WatchlistEntity>;

  constructor() {
    this.watchlistsStore = new Map();
  }

  async create(watchlist: WatchlistEntity): Promise<WatchlistEntity> {
    const copy = this.copyWatchlist(watchlist);
    this.watchlistsStore.set(watchlist.watchlist_id, copy);
    return this.copyWatchlist(copy);
  }

  async findById(watchlistId: string): Promise<WatchlistEntity | null> {
    const watchlist = this.watchlistsStore.get(watchlistId);
    return watchlist ? this.copyWatchlist(watchlist) : null;
  }

  async findByCustomerId(customerId: string): Promise<WatchlistEntity[]> {
    const watchlists = Array.from(this.watchlistsStore.values()).filter(
      w => w.customer_id === customerId
    );
    return watchlists.map(w => this.copyWatchlist(w));
  }

  async update(watchlistId: string, updates: Partial<WatchlistEntity>): Promise<WatchlistEntity> {
    const watchlist = this.watchlistsStore.get(watchlistId);
    if (!watchlist) {
      throw new Error(`Watchlist ${watchlistId} not found`);
    }

    const updated: WatchlistEntity = {
      ...watchlist,
      ...updates,
      watchlist_id: watchlist.watchlist_id,
      customer_id: watchlist.customer_id,
      created_at: watchlist.created_at
    };

    this.watchlistsStore.set(watchlistId, updated);
    return this.copyWatchlist(updated);
  }

  async delete(watchlistId: string): Promise<void> {
    this.watchlistsStore.delete(watchlistId);
  }

  async countByCustomerId(customerId: string): Promise<number> {
    return Array.from(this.watchlistsStore.values()).filter(
      w => w.customer_id === customerId
    ).length;
  }

  async clear(): Promise<void> {
    this.watchlistsStore.clear();
  }

  private copyWatchlist(watchlist: WatchlistEntity): WatchlistEntity {
    return {
      watchlist_id: watchlist.watchlist_id,
      customer_id: watchlist.customer_id,
      name: watchlist.name,
      symbols: [...watchlist.symbols],
      created_at: new Date(watchlist.created_at)
    };
  }
}
