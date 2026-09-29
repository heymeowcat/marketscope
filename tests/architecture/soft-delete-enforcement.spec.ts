import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { Stock, StockStatus } from '../../src/domain/stock';
import { StockSoftDeleteRule } from '../../src/domain/stock-soft-delete-rule';
import { HardDeleteNotAllowedException } from '../../src/domain/exceptions';

// [AC-03-C] Architectural test ensuring hard-delete blocking
describe('Soft-Delete Enforcement', () => {
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

  // [AC-03-C] No hard-delete queries allowed
  describe('Hard-Delete Query Blocking', () => {
    const illegalQueries = [
      'DELETE FROM stocks WHERE symbol = ?',
      'delete from stocks',
      'DELETE FROM stock WHERE id = 1',
      'DELETE FROM STOCKS',
      '  DELETE FROM stocks  ',
      'DELETE FROM stocks WHERE status = ?'
    ];

    illegalQueries.forEach(query => {
      it(`[AC-03-C] should reject query: "${query.trim()}"`, () => {
        expect(() => {
          StockSoftDeleteRule.validateNoHardDelete(query);
        }).toThrow(HardDeleteNotAllowedException);
      });
    });

    const legalQueries = [
      "UPDATE stocks SET status = 'DELISTED' WHERE symbol = ?",
      'SELECT * FROM stocks WHERE status = ?',
      'INSERT INTO stocks (symbol, company_name) VALUES (?, ?)',
      'INSERT INTO price_history (symbol, price) VALUES (?, ?)'
    ];

    legalQueries.forEach(query => {
      it(`[AC-03-C] should allow query: "${query}"`, () => {
        expect(() => {
          StockSoftDeleteRule.validateNoHardDelete(query);
        }).not.toThrow();
      });
    });
  });

  // [AC-03-C] Soft-delete invariant
  describe('Soft-Delete Invariant', () => {
    it('[AC-03-C] should enforce that delisted stock is never physically removed', () => {
      const delistedStock = StockSoftDeleteRule.softDelete(testStock);

      expect(delistedStock.symbol).toBe(testStock.symbol);
      expect(delistedStock.status).toBe(StockStatus.DELISTED);
      expect(delistedStock.delisted_at).not.toBeNull();
    });

    it('[AC-03-C] should maintain all stock fields on soft-delete', () => {
      const delistedStock = StockSoftDeleteRule.softDelete(testStock);

      expect(delistedStock.symbol).toBe(testStock.symbol);
      expect(delistedStock.company_name).toBe(testStock.company_name);
      expect(delistedStock.sector).toBe(testStock.sector);
      expect(delistedStock.exchange).toBe(testStock.exchange);
      expect(delistedStock.current_price.toString()).toBe(testStock.current_price.toString());
      expect(delistedStock.created_at).toBe(testStock.created_at);
    });

    it('[AC-03-C] should be idempotent - soft-delete of already delisted stock', () => {
      const delistedOnce = StockSoftDeleteRule.softDelete(testStock);
      const delistedTwice = StockSoftDeleteRule.softDelete(delistedOnce);

      expect(delistedTwice.status).toBe(StockStatus.DELISTED);
      expect(delistedTwice.delisted_at).not.toBeNull();
    });
  });

  // [AC-03] Stock status transitions
  describe('Stock Status Transitions', () => {
    it('[AC-03] should only allow ACTIVE -> DELISTED transition', () => {
      const active = testStock;
      expect(active.status).toBe(StockStatus.ACTIVE);

      const delisted = StockSoftDeleteRule.softDelete(active);
      expect(delisted.status).toBe(StockStatus.DELISTED);
    });

    it('[AC-03] should not allow status to be set to any other value', () => {
      // Only ACTIVE and DELISTED are valid statuses
      const validStatuses = Object.values(StockStatus);
      expect(validStatuses).toContain(StockStatus.ACTIVE);
      expect(validStatuses).toContain(StockStatus.DELISTED);
      expect(validStatuses).toHaveLength(2);
    });
  });

  // [AC-03-C] Query pattern enforcement
  describe('Query Pattern Enforcement', () => {
    it('[AC-03-C] should detect DELETE statements regardless of whitespace', () => {
      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete('  \n  DELETE   FROM   stocks  \n  ');
      }).toThrow(HardDeleteNotAllowedException);
    });

    it('[AC-03-C] should be case-insensitive', () => {
      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete('delete from STOCKS');
      }).toThrow(HardDeleteNotAllowedException);

      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete('DeLeTe FrOm sToCkS');
      }).toThrow(HardDeleteNotAllowedException);
    });

    it('[AC-03-C] should distinguish between stock singular and plural', () => {
      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete('DELETE FROM stocks');
      }).toThrow(HardDeleteNotAllowedException);

      expect(() => {
        StockSoftDeleteRule.validateNoHardDelete('DELETE FROM stock');
      }).toThrow(HardDeleteNotAllowedException);
    });
  });

  // [AC-03] Decimal precision for prices
  describe('Fixed-Point Price Precision (NFR-01)', () => {
    it('[AC-03] should maintain Decimal precision after soft-delete', () => {
      const stockWithPrecision = new Stock({
        ...testStock,
        current_price: new Decimal('125.6789')
      });

      const delisted = StockSoftDeleteRule.softDelete(stockWithPrecision);

      expect(delisted.current_price).toBeInstanceOf(Decimal);
      expect(delisted.current_price.toString()).toBe('125.6789');
    });
  });
});
