import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import { Stock, StockEntity, CreateStockInput, UpdateStockInput, StockStatus } from '../domain/stock';
import { StockAlreadyExistsException, StockNotFoundException } from '../domain/exceptions';
import { IStockRepository } from '../repositories/stock-repository';
import { IPriceHistoryRepository } from '../repositories/price-history-repository';

export interface StockCatalogServiceDeps {
  stockRepository: IStockRepository;
  priceHistoryRepository: IPriceHistoryRepository;
}

export interface StockResponse {
  symbol: string;
  company_name: string;
  sector: string;
  exchange: string;
  status: string;
  current_price: string;
  created_at: string;
  delisted_at: string | null;
}

export class StockCatalogService {
  private stockRepository: IStockRepository;
  private priceHistoryRepository: IPriceHistoryRepository;

  constructor(deps: StockCatalogServiceDeps) {
    this.stockRepository = deps.stockRepository;
    this.priceHistoryRepository = deps.priceHistoryRepository;
  }

  async createStock(input: CreateStockInput): Promise<StockEntity> {
    // Validate that stock doesn't already exist
    const existing = await this.stockRepository.findBySymbol(input.symbol);
    if (existing) {
      throw new StockAlreadyExistsException(input.symbol);
    }

    // Create with Decimal price (NFR-01)
    const stock: StockEntity = {
      symbol: input.symbol,
      company_name: input.company_name,
      sector: input.sector,
      exchange: input.exchange,
      status: StockStatus.ACTIVE,
      current_price: new Decimal(input.initial_price),
      created_at: new Date(),
      delisted_at: null
    };

    const created = await this.stockRepository.create(stock);

    // Record initial price in history
    await this.priceHistoryRepository.append({
      id: uuidv4(),
      symbol: input.symbol,
      price: new Decimal(input.initial_price),
      timestamp: new Date()
    });

    return created;
  }

  async updateStock(symbol: string, input: UpdateStockInput): Promise<StockEntity> {
    const existing = await this.stockRepository.findBySymbol(symbol);
    if (!existing) {
      throw new StockNotFoundException(symbol);
    }

    // Only update metadata fields, not price or status
    const updates: Partial<StockEntity> = {};
    if (input.company_name !== undefined) updates.company_name = input.company_name;
    if (input.sector !== undefined) updates.sector = input.sector;
    if (input.exchange !== undefined) updates.exchange = input.exchange;

    return await this.stockRepository.update(symbol, updates);
  }

  async softDeleteStock(symbol: string): Promise<StockEntity> {
    const existing = await this.stockRepository.findBySymbol(symbol);
    if (!existing) {
      throw new StockNotFoundException(symbol);
    }

    return await this.stockRepository.softDelete(symbol);
  }

  async getStockBySymbol(symbol: string): Promise<StockEntity> {
    const stock = await this.stockRepository.findBySymbolActive(symbol);
    if (!stock) {
      throw new StockNotFoundException(symbol);
    }
    return stock;
  }

  async searchStocks(filters: {
    sector?: string;
    exchange?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<StockEntity[]> {
    return await this.stockRepository.search({
      ...filters,
      excludeDelisted: true
    });
  }

  async getStockForAdmin(symbol: string): Promise<StockEntity> {
    const stock = await this.stockRepository.findBySymbol(symbol);
    if (!stock) {
      throw new StockNotFoundException(symbol);
    }
    return stock;
  }

  toResponse(stock: StockEntity): StockResponse {
    const price = stock.current_price instanceof Decimal
      ? stock.current_price
      : new Decimal(stock.current_price as any);

    return {
      symbol: stock.symbol,
      company_name: stock.company_name,
      sector: stock.sector,
      exchange: stock.exchange,
      status: stock.status,
      current_price: price.toFixed(2),
      created_at: stock.created_at.toISOString(),
      delisted_at: stock.delisted_at ? stock.delisted_at.toISOString() : null
    };
  }
}
