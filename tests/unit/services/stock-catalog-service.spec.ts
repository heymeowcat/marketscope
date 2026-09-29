import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import { StockCatalogService } from '../../../src/services/stock-catalog-service';
import { StockRepository } from '../../../src/repositories/stock-repository';
import { PriceHistoryRepository } from '../../../src/repositories/price-history-repository';
import { StockStatus } from '../../../src/domain/stock';
import {
  StockAlreadyExistsException,
  StockNotFoundException
} from '../../../src/domain/exceptions';

// [AC-03] Test suite for stock catalog CRUD operations
describe('StockCatalogService', () => {
  let stockCatalogService: StockCatalogService;
  let stockRepository: StockRepository;
  let priceHistoryRepository: PriceHistoryRepository;

  beforeEach(async () => {
    stockRepository = new StockRepository();
    priceHistoryRepository = new PriceHistoryRepository();
    await stockRepository.clear();
    await priceHistoryRepository.clear();
    stockCatalogService = new StockCatalogService({
      stockRepository,
      priceHistoryRepository
    });
  });

  describe('createStock', () => {
    // [AC-03-A] Admin creates stock symbol
    it('[AC-03-A] should create a stock with ACTIVE status', async () => {
      const result = await stockCatalogService.createStock({
        symbol: 'NVDA',
        company_name: 'NVIDIA Corporation',
        sector: 'Technology',
        exchange: 'NASDAQ',
        initial_price: '125.50'
      });

      expect(result.symbol).toBe('NVDA');
      expect(result.company_name).toBe('NVIDIA Corporation');
      expect(result.status).toBe(StockStatus.ACTIVE);
      expect(result.current_price).toBeInstanceOf(Decimal);
      expect(result.current_price.toFixed(2)).toBe('125.50');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.delisted_at).toBeNull();
    });

    // [AC-03-A] Price should be stored as Decimal (NFR-01)
    it('[AC-03-A] should use Decimal for fixed-point price (NFR-01)', async () => {
      const result = await stockCatalogService.createStock({
        symbol: 'TSLA',
        company_name: 'Tesla Inc',
        sector: 'Consumer',
        exchange: 'NASDAQ',
        initial_price: '245.6789'
      });

      expect(result.current_price).toBeInstanceOf(Decimal);
      expect(result.current_price.decimalPlaces()).toBeLessThanOrEqual(4);
    });

    // [AC-03-A] Duplicate symbol should fail
    it('[AC-03-A] should throw error for duplicate symbol', async () => {
      await stockCatalogService.createStock({
        symbol: 'AAPL',
        company_name: 'Apple Inc',
        sector: 'Technology',
        exchange: 'NASDAQ',
        initial_price: '150.00'
      });

      expect(async () => {
        await stockCatalogService.createStock({
          symbol: 'AAPL',
          company_name: 'Apple Inc Duplicate',
          sector: 'Technology',
          exchange: 'NASDAQ',
          initial_price: '150.00'
        });
      }).rejects.toThrow(StockAlreadyExistsException);
    });

    // [AC-03-A] Price history should be recorded
    it('[AC-03-A] should record initial price in history', async () => {
      await stockCatalogService.createStock({
        symbol: 'MSFT',
        company_name: 'Microsoft',
        sector: 'Technology',
        exchange: 'NASDAQ',
        initial_price: '300.00'
      });

      const history = await priceHistoryRepository.findBySymbol('MSFT');
      expect(history).toHaveLength(1);
      expect(history[0].price.toFixed(2)).toBe('300.00');
    });
  });

  describe('updateStock', () => {
    beforeEach(async () => {
      await stockCatalogService.createStock({
        symbol: 'GOOG',
        company_name: 'Google Inc',
        sector: 'Technology',
        exchange: 'NASDAQ',
        initial_price: '140.00'
      });
    });

    // [AC-03] Update metadata
    it('[AC-03] should update company name', async () => {
      const result = await stockCatalogService.updateStock('GOOG', {
        company_name: 'Alphabet Inc'
      });

      expect(result.company_name).toBe('Alphabet Inc');
      expect(result.symbol).toBe('GOOG');
      expect(result.current_price.toFixed(2)).toBe('140.00');
    });

    it('[AC-03] should update sector', async () => {
      const result = await stockCatalogService.updateStock('GOOG', {
        sector: 'Cloud Services'
      });

      expect(result.sector).toBe('Cloud Services');
    });

    it('[AC-03] should update multiple fields', async () => {
      const result = await stockCatalogService.updateStock('GOOG', {
        company_name: 'Alphabet Inc',
        sector: 'Cloud Services',
        exchange: 'NYSE'
      });

      expect(result.company_name).toBe('Alphabet Inc');
      expect(result.sector).toBe('Cloud Services');
      expect(result.exchange).toBe('NYSE');
    });

    it('[AC-03] should throw error for non-existent stock', async () => {
      expect(async () => {
        await stockCatalogService.updateStock('INVALID', {
          company_name: 'Test'
        });
      }).rejects.toThrow(StockNotFoundException);
    });
  });

  describe('softDeleteStock', () => {
    beforeEach(async () => {
      await stockCatalogService.createStock({
        symbol: 'AMD',
        company_name: 'Advanced Micro Devices',
        sector: 'Technology',
        exchange: 'NASDAQ',
        initial_price: '140.00'
      });
    });

    // [AC-03-B] Admin soft-deletes stock symbol
    it('[AC-03-B] should soft-delete stock by setting status to DELISTED', async () => {
      const result = await stockCatalogService.softDeleteStock('AMD');

      expect(result.status).toBe(StockStatus.DELISTED);
      expect(result.delisted_at).toBeInstanceOf(Date);
      expect(result.symbol).toBe('AMD');
    });

    // [AC-03-B] Stock should still exist in database (no hard delete)
    it('[AC-03-B] should not physically remove stock from repository', async () => {
      await stockCatalogService.softDeleteStock('AMD');

      const stock = await stockRepository.findBySymbol('AMD');
      expect(stock).not.toBeNull();
      expect(stock!.status).toBe(StockStatus.DELISTED);
    });

    // [AC-03-B] Delisted_at should be populated
    it('[AC-03-B] should populate delisted_at timestamp', async () => {
      const beforeTime = new Date();
      await stockCatalogService.softDeleteStock('AMD');
      const afterTime = new Date();

      const stock = await stockRepository.findBySymbol('AMD');
      expect(stock!.delisted_at).not.toBeNull();
      expect(stock!.delisted_at!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(stock!.delisted_at!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('[AC-03-B] should throw error for non-existent stock', async () => {
      expect(async () => {
        await stockCatalogService.softDeleteStock('INVALID');
      }).rejects.toThrow(StockNotFoundException);
    });
  });

  describe('getStockBySymbol', () => {
    beforeEach(async () => {
      await stockCatalogService.createStock({
        symbol: 'NVDA',
        company_name: 'NVIDIA',
        sector: 'Technology',
        exchange: 'NASDAQ',
        initial_price: '125.50'
      });
    });

    // [AC-03-D] Customer catalog search excludes delisted
    it('[AC-03-D] should return active stock by symbol', async () => {
      const stock = await stockCatalogService.getStockBySymbol('NVDA');

      expect(stock.symbol).toBe('NVDA');
      expect(stock.status).toBe(StockStatus.ACTIVE);
    });

    // [AC-03-D] Delisted stocks should not be found
    it('[AC-03-D] should not return delisted stock', async () => {
      await stockCatalogService.softDeleteStock('NVDA');

      expect(async () => {
        await stockCatalogService.getStockBySymbol('NVDA');
      }).rejects.toThrow(StockNotFoundException);
    });

    it('[AC-03-D] should throw error for non-existent stock', async () => {
      expect(async () => {
        await stockCatalogService.getStockBySymbol('INVALID');
      }).rejects.toThrow(StockNotFoundException);
    });
  });

  describe('searchStocks', () => {
    beforeEach(async () => {
      await stockCatalogService.createStock({
        symbol: 'NVDA',
        company_name: 'NVIDIA Corporation',
        sector: 'Technology',
        exchange: 'NASDAQ',
        initial_price: '125.50'
      });

      await stockCatalogService.createStock({
        symbol: 'TSLA',
        company_name: 'Tesla Inc',
        sector: 'Consumer',
        exchange: 'NASDAQ',
        initial_price: '245.00'
      });

      await stockCatalogService.createStock({
        symbol: 'F',
        company_name: 'Ford Motor',
        sector: 'Consumer',
        exchange: 'NYSE',
        initial_price: '10.00'
      });
    });

    // [AC-03-D] Customer catalog search with filters
    it('[AC-03-D] should search by sector', async () => {
      const results = await stockCatalogService.searchStocks({
        sector: 'Technology'
      });

      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe('NVDA');
    });

    it('[AC-03-D] should search by exchange', async () => {
      const results = await stockCatalogService.searchStocks({
        exchange: 'NYSE'
      });

      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe('F');
    });

    it('[AC-03-D] should search by name or symbol', async () => {
      const results = await stockCatalogService.searchStocks({
        search: 'NVIDIA'
      });

      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe('NVDA');
    });

    // [AC-03-D] Exclude delisted stocks from results
    it('[AC-03-D] should exclude delisted stocks from search results', async () => {
      await stockCatalogService.softDeleteStock('NVDA');

      const results = await stockCatalogService.searchStocks({
        search: ''
      });

      expect(results).toHaveLength(2);
      expect(results.find(s => s.symbol === 'NVDA')).toBeUndefined();
    });

    it('[AC-03-D] should return all active stocks by default', async () => {
      const results = await stockCatalogService.searchStocks({});

      expect(results).toHaveLength(3);
    });

    it('[AC-03-D] should support pagination', async () => {
      const results = await stockCatalogService.searchStocks({
        limit: 2,
        offset: 0
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('toResponse', () => {
    it('[AC-03] should convert stock to response format', async () => {
      const stock = await stockCatalogService.createStock({
        symbol: 'AAPL',
        company_name: 'Apple Inc',
        sector: 'Technology',
        exchange: 'NASDAQ',
        initial_price: '150.00'
      });

      const response = stockCatalogService.toResponse(stock);

      expect(response.symbol).toBe('AAPL');
      expect(response.company_name).toBe('Apple Inc');
      expect(response.current_price).toMatch(/^150\.0{0,2}$/);
      expect(response.status).toBe(StockStatus.ACTIVE);
      expect(response.delisted_at).toBeNull();
      expect(response.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('[AC-03] should include delisted_at in response when soft-deleted', async () => {
      const stock = await stockCatalogService.createStock({
        symbol: 'TSLA',
        company_name: 'Tesla',
        sector: 'Consumer',
        exchange: 'NASDAQ',
        initial_price: '245.00'
      });

      const deleted = await stockCatalogService.softDeleteStock('TSLA');
      const response = stockCatalogService.toResponse(deleted);

      expect(response.status).toBe(StockStatus.DELISTED);
      expect(response.delisted_at).not.toBeNull();
      expect(response.delisted_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
