export interface IWatchlistSymbolRepository {
  addSymbols(watchlistId: string, symbols: string[]): Promise<void>;
  findSymbolsByWatchlistId(watchlistId: string): Promise<string[]>;
  deleteByWatchlistId(watchlistId: string): Promise<void>;
  clear?(): Promise<void>;
}

export class WatchlistSymbolRepository implements IWatchlistSymbolRepository {
  private symbolsStore: Map<string, string[]>;

  constructor() {
    this.symbolsStore = new Map();
  }

  async addSymbols(watchlistId: string, symbols: string[]): Promise<void> {
    const current = this.symbolsStore.get(watchlistId) || [];
    const updated = [...current, ...symbols];
    this.symbolsStore.set(watchlistId, updated);
  }

  async findSymbolsByWatchlistId(watchlistId: string): Promise<string[]> {
    const symbols = this.symbolsStore.get(watchlistId);
    return symbols ? [...symbols] : [];
  }

  async deleteByWatchlistId(watchlistId: string): Promise<void> {
    this.symbolsStore.delete(watchlistId);
  }

  async clear(): Promise<void> {
    this.symbolsStore.clear();
  }
}
