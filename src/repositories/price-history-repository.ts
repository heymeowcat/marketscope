import Decimal from 'decimal.js';

export interface PriceHistoryEntity {
  id: string;
  symbol: string;
  price: Decimal;
  timestamp: Date;
}

export interface IPriceHistoryRepository {
  append(entry: PriceHistoryEntity): Promise<void>;
  findBySymbol(symbol: string, limit?: number): Promise<PriceHistoryEntity[]>;
  findLatestBySymbol(symbol: string): Promise<PriceHistoryEntity | null>;
  clear?(): Promise<void>;
}

export class PriceHistoryRepository implements IPriceHistoryRepository {
  private priceHistoryStore: PriceHistoryEntity[] = [];

  async append(entry: PriceHistoryEntity): Promise<void> {
    this.priceHistoryStore.push({
      ...entry,
      price: entry.price instanceof Decimal ? entry.price : new Decimal(entry.price),
      timestamp: new Date(entry.timestamp)
    });
  }

  async findBySymbol(symbol: string, limit: number = 100): Promise<PriceHistoryEntity[]> {
    return this.priceHistoryStore
      .filter(p => p.symbol === symbol)
      .slice(-limit)
      .map(p => ({
        ...p,
        price: new Decimal(p.price.toString())
      }));
  }

  async findLatestBySymbol(symbol: string): Promise<PriceHistoryEntity | null> {
    const entries = this.priceHistoryStore.filter(p => p.symbol === symbol);
    if (entries.length === 0) return null;
    const latest = entries[entries.length - 1];
    return {
      ...latest,
      price: new Decimal(latest.price.toString())
    };
  }

  async clear(): Promise<void> {
    this.priceHistoryStore = [];
  }
}
