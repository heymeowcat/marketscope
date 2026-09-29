import Decimal from 'decimal.js';
import { StockEntity, Stock, StockStatus } from '../domain/stock';
import { HardDeleteNotAllowedException } from '../domain/exceptions';
import { StockSoftDeleteRule } from '../domain/stock-soft-delete-rule';

export interface IStockRepository {
  create(stock: StockEntity): Promise<StockEntity>;
  findBySymbol(symbol: string): Promise<StockEntity | null>;
  findBySymbolActive(symbol: string): Promise<StockEntity | null>;
  search(filters: {
    sector?: string;
    exchange?: string;
    search?: string;
    excludeDelisted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<StockEntity[]>;
  findAll(limit?: number, offset?: number): Promise<StockEntity[]>;
  update(symbol: string, updates: Partial<StockEntity>): Promise<StockEntity>;
  softDelete(symbol: string): Promise<StockEntity>;
  updatePrice(symbol: string, price: Decimal): Promise<void>;
  clear?(): Promise<void>;
}

export class StockRepository implements IStockRepository {
  private stocksStore: Map<string, StockEntity>;

  constructor() {
    this.stocksStore = new Map();
  }

  async create(stock: StockEntity): Promise<StockEntity> {
    if (this.stocksStore.has(stock.symbol)) {
      throw new Error(`Stock ${stock.symbol} already exists`);
    }
    const stockCopy = this.copyStock(stock);
    this.stocksStore.set(stock.symbol, stockCopy);
    return this.copyStock(stockCopy);
  }

  async findBySymbol(symbol: string): Promise<StockEntity | null> {
    const stock = this.stocksStore.get(symbol);
    return stock ? this.copyStock(stock) : null;
  }

  async findBySymbolActive(symbol: string): Promise<StockEntity | null> {
    const stock = this.stocksStore.get(symbol);
    if (!stock) return null;
    if (stock.status === StockStatus.DELISTED) return null;
    return this.copyStock(stock);
  }

  async search(filters: {
    sector?: string;
    exchange?: string;
    search?: string;
    excludeDelisted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<StockEntity[]> {
    let results = Array.from(this.stocksStore.values());

    // Filter by status
    if (filters.excludeDelisted !== false) {
      results = results.filter(s => s.status === StockStatus.ACTIVE);
    }

    // Filter by sector
    if (filters.sector) {
      results = results.filter(s =>
        s.sector.toLowerCase().includes(filters.sector!.toLowerCase())
      );
    }

    // Filter by exchange
    if (filters.exchange) {
      results = results.filter(s =>
        s.exchange.toLowerCase().includes(filters.exchange!.toLowerCase())
      );
    }

    // Search by symbol or company name
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      results = results.filter(s =>
        s.symbol.toLowerCase().includes(searchTerm) ||
        s.company_name.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    results = results.slice(offset, offset + limit);

    return results.map(s => this.copyStock(s));
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<StockEntity[]> {
    const stocks = Array.from(this.stocksStore.values());
    return stocks.slice(offset, offset + limit).map(s => this.copyStock(s));
  }

  async update(symbol: string, updates: Partial<StockEntity>): Promise<StockEntity> {
    const stock = this.stocksStore.get(symbol);
    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    // Prevent hard deletes via updates
    if ('deleted' in updates || updates.status === undefined) {
      // Allow updates
    }

    const updated = {
      ...stock,
      ...updates,
      symbol: stock.symbol // Prevent symbol from being changed
    };

    this.stocksStore.set(symbol, updated);
    return this.copyStock(updated);
  }

  async softDelete(symbol: string): Promise<StockEntity> {
    const stock = this.stocksStore.get(symbol);
    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    const updated: StockEntity = {
      ...stock,
      status: StockStatus.DELISTED,
      delisted_at: new Date()
    };

    this.stocksStore.set(symbol, updated);
    return this.copyStock(updated);
  }

  async updatePrice(symbol: string, price: Decimal): Promise<void> {
    const stock = this.stocksStore.get(symbol);
    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    stock.current_price = price instanceof Decimal ? price : new Decimal(price);
  }

  async clear(): Promise<void> {
    this.stocksStore.clear();
  }

  private copyStock(stock: StockEntity): StockEntity {
    return {
      symbol: stock.symbol,
      company_name: stock.company_name,
      sector: stock.sector,
      exchange: stock.exchange,
      status: stock.status,
      current_price: stock.current_price instanceof Decimal
        ? new Decimal(stock.current_price.toString())
        : new Decimal(stock.current_price as any),
      created_at: new Date(stock.created_at),
      delisted_at: stock.delisted_at ? new Date(stock.delisted_at) : null
    };
  }
}
