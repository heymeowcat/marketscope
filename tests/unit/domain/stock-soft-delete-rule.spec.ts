import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { Stock, StockStatus } from '../../../src/domain/stock';
import { StockSoftDeleteRule } from '../../../src/domain/stock-soft-delete-rule';
import { HardDeleteNotAllowedException } from '../../../src/domain/exceptions';

// [AC-03] Test suite for soft-delete invariant enforcement
describe('StockSoftDeleteRule', () => {
  const testStock = new Stock({
    symbol: 'NVDA',
    company_name: 'NVIDIA Corporation',
    sector: 'Technology',
    exchange: 'NASDAQ',
    status: StockStatus.ACTIVE,
    current_price: new Decimal('125.50'),
    created_at: new Date(),
    delisted_at: null
  });

  describe('validateNoHardDelete', () => {
    // [AC-03-C] Hard-delete blocked
    it('[AC-03-C] should reject DELETE FROM stocks query', () => {
      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete('DELETE FROM stocks WHERE symbol = ?');
      }).toThrow(HardDeleteNotAllowedException);
    });

    it('[AC-03-C] should reject delete queries (case insensitive)', () => {
      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete('delete from stocks');
      }).toThrow(HardDeleteNotAllowedException);
    });

    it('[AC-03-C] should reject DELETE from stock singular', () => {
      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete('DELETE FROM stock WHERE id = 1');
      }).toThrow(HardDeleteNotAllowedException);
    });

    it('[AC-03-C] should allow UPDATE queries', () => {
      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete(
          "UPDATE stocks SET status = 'DELISTED' WHERE symbol = ?"
        );
      }).not.toThrow();
    });

    it('[AC-03-C] should allow SELECT queries', () => {
      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete('SELECT * FROM stocks');
      }).not.toThrow();
    });

    it('[AC-03-C] should allow INSERT queries', () => {
      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete(
          'INSERT INTO stocks (symbol, company_name) VALUES (?, ?)'
        );
      }).not.toThrow();
    });
  });

  describe('softDelete', () => {
    // [AC-03-B] Soft-delete should update status and timestamp
    it('[AC-03-B] should set status to DELISTED', () => {
      const result = StockSoftDeleteRule.softDelete(testStock);

      expect(result.status).toBe(StockStatus.DELISTED);
      expect(result.symbol).toBe('NVDA');
      expect(result.company_name).toBe('NVIDIA Corporation');
    });

    it('[AC-03-B] should set delisted_at timestamp', () => {
      const beforeTime = new Date();
      const result = StockSoftDeleteRule.softDelete(testStock);
      const afterTime = new Date();

      expect(result.delisted_at).not.toBeNull();
      expect(result.delisted_at!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.delisted_at!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    // [AC-03-B] Original stock should not be mutated
    it('[AC-03-B] should not mutate original stock', () => {
      const originalStatus = testStock.status;
      const originalDelisted = testStock.delisted_at;

      StockSoftDeleteRule.softDelete(testStock);

      expect(testStock.status).toBe(originalStatus);
      expect(testStock.delisted_at).toBe(originalDelisted);
    });

    // [AC-03-B] Price should be preserved
    it('[AC-03-B] should preserve current price', () => {
      const result = StockSoftDeleteRule.softDelete(testStock);

      expect(result.current_price.toFixed(2)).toBe('125.50');
    });
  });

  describe('isDelisted', () => {
    // [AC-03-D] Check if stock is delisted
    it('[AC-03-D] should return true for delisted stock', () => {
      const delistedStock = new Stock({
        ...testStock,
        status: StockStatus.DELISTED,
        delisted_at: new Date()
      });

      expect(StockSoftDeleteRule.isDelisted(delistedStock)).toBe(true);
    });

    it('[AC-03-D] should return false for active stock', () => {
      expect(StockSoftDeleteRule.isDelisted(testStock)).toBe(false);
    });
  });
});
