import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import { WatchlistService } from '../../../src/services/watchlist-service';
import { WatchlistRepository } from '../../../src/repositories/watchlist-repository';
import { WatchlistSymbolRepository } from '../../../src/repositories/watchlist-symbol-repository';
import { StockRepository } from '../../../src/repositories/stock-repository';
import { StockStatus } from '../../../src/domain/stock';
import {
  WatchlistLimitExceededException,
  WatchlistUpdateException,
  WatchlistNotFoundException
} from '../../../src/domain/exceptions';

// [AC-04][AC-05] Watchlist CRUD and atomic operations
describe('WatchlistService', () => {
  let watchlistService: WatchlistService;
  let watchlistRepository: WatchlistRepository;
  let watchlistSymbolRepository: WatchlistSymbolRepository;
  let stockRepository: StockRepository;

  beforeEach(async () => {
    watchlistRepository = new WatchlistRepository();
    watchlistSymbolRepository = new WatchlistSymbolRepository();
    stockRepository = new StockRepository();

    await watchlistRepository.clear?.();
    await watchlistSymbolRepository.clear?.();
    await stockRepository.clear?.();

    // Seed some stocks for testing
    await stockRepository.create({
      symbol: 'NVDA',
      company_name: 'NVIDIA',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('125.50'),
      created_at: new Date(),
      delisted_at: null
    });

    await stockRepository.create({
      symbol: 'AAPL',
      company_name: 'Apple',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('150.00'),
      created_at: new Date(),
      delisted_at: null
    });

    await stockRepository.create({
      symbol: 'MSFT',
      company_name: 'Microsoft',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('300.00'),
      created_at: new Date(),
      delisted_at: null
    });

    watchlistService = new WatchlistService({
      watchlistRepository,
      watchlistSymbolRepository,
      stockRepository
    });
  });

  describe('create', () => {
    // [AC-04-A] Should create watchlist with name and symbols
    it('[AC-04-A] should create a watchlist with name and symbols', async () => {
      const result = await watchlistService.create('customer-123', 'Semiconductors', ['NVDA', 'AAPL']);

      expect(result.watchlist_id).toBeDefined();
      expect(result.customer_id).toBe('customer-123');
      expect(result.name).toBe('Semiconductors');
      expect(result.symbols).toEqual(['NVDA', 'AAPL']);
      expect(result.created_at).toBeInstanceOf(Date);
    });

    // [AC-04-B] Should reject empty symbols
    it('[AC-04-B] should throw error when symbols array is empty', async () => {
      await expect(watchlistService.create('customer-123', 'Tech', [])).rejects.toThrow(WatchlistUpdateException);
    });

    // [AC-04-C] Should enforce 10-watchlist limit
    it('[AC-04-C] should throw WatchlistLimitExceededException when customer has 10 watchlists', async () => {
      const customerId = 'customer-999';

      // Create 10 watchlists
      for (let i = 0; i < 10; i++) {
        await watchlistService.create(customerId, `Watchlist ${i}`, ['NVDA']);
      }

      // Attempt to create 11th
      await expect(watchlistService.create(customerId, 'Watchlist 11', ['AAPL'])).rejects.toThrow(WatchlistLimitExceededException);
    });
  });

  describe('update', () => {
    // [AC-05-A] Should atomically update name and symbols
    it('[AC-05-A] should atomically update watchlist name and add symbols', async () => {
      const created = await watchlistService.create('customer-123', 'Old Name', ['AAPL']);
      const watchlistId = created.watchlist_id;

      const updated = await watchlistService.update(watchlistId, 'Big Tech', ['AAPL', 'MSFT']);

      expect(updated.name).toBe('Big Tech');
      expect(updated.symbols).toEqual(['AAPL', 'MSFT']);
    });

    // [AC-05-B] Should rollback on invalid symbol
    it('[AC-05-B] should rollback entire update if any symbol is invalid', async () => {
      const created = await watchlistService.create('customer-123', 'Old Name', ['AAPL']);
      const watchlistId = created.watchlist_id;

      await expect(watchlistService.update(watchlistId, 'New Name', ['NVDA', 'INVALID_SYM_XYZ'])).rejects.toThrow(WatchlistUpdateException);

      // Verify rollback: original state should be preserved
      const watchlist = await watchlistService.getById(watchlistId);
      expect(watchlist.name).toBe('Old Name');
      expect(watchlist.symbols).toEqual(['AAPL']);
    });

    // [AC-05-B] Should not update if symbol doesn't exist in catalog
    it('[AC-05-B] should reject update if symbol does not exist in stock catalog', async () => {
      const created = await watchlistService.create('customer-123', 'Tech', ['AAPL']);
      const watchlistId = created.watchlist_id;

      await expect(watchlistService.update(watchlistId, 'Tech', ['NONEXISTENT'])).rejects.toThrow(WatchlistUpdateException);
    });
  });

  describe('delete', () => {
    // [AC-05-C] Should delete watchlist
    it('[AC-05-C] should atomically delete watchlist', async () => {
      const created = await watchlistService.create('customer-123', 'Tech', ['AAPL']);
      const watchlistId = created.watchlist_id;

      await watchlistService.delete(watchlistId);

      await expect(watchlistService.getById(watchlistId)).rejects.toThrow(WatchlistNotFoundException);
    });
  });

  describe('getById', () => {
    it('[AC-04] should retrieve watchlist by ID', async () => {
      const created = await watchlistService.create('customer-123', 'Tech', ['NVDA', 'AAPL']);
      const watchlistId = created.watchlist_id;

      const retrieved = await watchlistService.getById(watchlistId);

      expect(retrieved.watchlist_id).toBe(watchlistId);
      expect(retrieved.name).toBe('Tech');
      expect(retrieved.symbols).toEqual(['NVDA', 'AAPL']);
    });

    it('[AC-04] should throw WatchlistNotFoundException if not found', async () => {
      await expect(watchlistService.getById('nonexistent-id')).rejects.toThrow(WatchlistNotFoundException);
    });
  });

  describe('getByCustomerId', () => {
    it('[AC-04] should retrieve all watchlists for a customer', async () => {
      await watchlistService.create('customer-123', 'Tech', ['NVDA']);
      await watchlistService.create('customer-123', 'Cloud', ['MSFT']);

      const watchlists = await watchlistService.getByCustomerId('customer-123');

      expect(watchlists).toHaveLength(2);
      expect(watchlists[0].name).toBe('Tech');
      expect(watchlists[1].name).toBe('Cloud');
    });

    it('[AC-04] should return empty array for customer with no watchlists', async () => {
      const watchlists = await watchlistService.getByCustomerId('customer-999');

      expect(watchlists).toEqual([]);
    });
  });
});
