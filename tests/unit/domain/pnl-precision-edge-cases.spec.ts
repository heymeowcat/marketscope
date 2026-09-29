import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { PortfolioPnLPolicy } from '../../../src/domain/portfolio-pnl-policy';
import { Holding } from '../../../src/domain/holding';

// [NFR-01] Decimal.js precision boundary tests
describe('PnL Precision Edge Cases', () => {
  describe('Fixed-point arithmetic precision', () => {
    // [NFR-01] 0.01 increment precision
    it('[NFR-01] should handle 0.01 cent increments correctly', () => {
      const holdings = [
        new Holding({
          id: 'hold-1',
          customer_id: 'cust-001',
          symbol: 'TEST',
          quantity: 1,
          avg_buy_price: new Decimal('100.01'),
          created_at: new Date()
        })
      ];

      const result = PortfolioPnLPolicy.calculateTotalInvested(holdings);

      expect(result.toFixed(2)).toBe('100.01');
    });

    // [NFR-01] Avoid floating-point rounding errors
    it('[NFR-01] should avoid 0.1 + 0.2 = 0.30000000001 error', () => {
      const price1 = new Decimal('0.1');
      const price2 = new Decimal('0.2');
      const sum = price1.plus(price2);

      expect(sum.toFixed(2)).toBe('0.30');
    });

    // [NFR-01] Large numbers with small decimals
    it('[NFR-01] should handle large numbers with decimal precision', () => {
      const holdings = [
        new Holding({
          id: 'hold-1',
          customer_id: 'cust-001',
          symbol: 'TEST',
          quantity: 1000000,
          avg_buy_price: new Decimal('0.01'),
          created_at: new Date()
        })
      ];

      const result = PortfolioPnLPolicy.calculateTotalInvested(holdings);

      expect(result.toFixed(2)).toBe('10000.00');
    });

    // [NFR-01] Very small differences should not be lost
    it('[NFR-01] should preserve tiny differences in portfolio value', () => {
      const currentValue = new Decimal('1000.01');
      const totalInvested = new Decimal('1000.00');

      const result = PortfolioPnLPolicy.calculateAbsolutePnL(currentValue, totalInvested);

      expect(result.toFixed(2)).toBe('0.01');
    });

    // [NFR-01] Repetitive multiplication should maintain precision
    it('[NFR-01] should maintain precision across multiple holdings', () => {
      const holdings = [];
      for (let i = 0; i < 100; i++) {
        holdings.push(
          new Holding({
            id: `hold-${i}`,
            customer_id: 'cust-001',
            symbol: `TEST${i}`,
            quantity: 1,
            avg_buy_price: new Decimal('1.01'),
            created_at: new Date()
          })
        );
      }

      const result = PortfolioPnLPolicy.calculateTotalInvested(holdings);

      expect(result.toFixed(2)).toBe('101.00');
    });
  });

  describe('Division edge cases', () => {
    // [NFR-01] Division by zero handling in percent calculation
    it('[NFR-01] should handle division by zero gracefully', () => {
      const absolutePnL = new Decimal('100.00');
      const totalInvested = new Decimal('0.00');

      const result = PortfolioPnLPolicy.calculatePercentPnL(absolutePnL, totalInvested);

      expect(result.toFixed(2)).toBe('0.00');
    });

    // [NFR-01] Very small divisor
    it('[NFR-01] should handle very small divisor', () => {
      const absolutePnL = new Decimal('0.01');
      const totalInvested = new Decimal('0.01');

      const result = PortfolioPnLPolicy.calculatePercentPnL(absolutePnL, totalInvested);

      expect(result.toFixed(2)).toBe('100.00');
    });

    // [NFR-01] Repeating decimals
    it('[NFR-01] should handle repeating decimals correctly', () => {
      const avgBuyPrice = new Decimal('100.00');
      const currentPrice = new Decimal('99.99');

      const result = PortfolioPnLPolicy.calculateHoldingPnLPercent(avgBuyPrice, currentPrice);

      expect(result.toFixed(2)).toBe('-0.01');
    });
  });

  describe('Negative values', () => {
    // [NFR-01] Negative holdings should be calculated correctly
    it('[NFR-01] should handle negative absolute P&L', () => {
      const absolutePnL = new Decimal('-1234.56');
      const totalInvested = new Decimal('5000.00');

      const result = PortfolioPnLPolicy.calculatePercentPnL(absolutePnL, totalInvested);

      expect(result.toFixed(2)).toBe('-24.69');
    });

    // [NFR-01] Negative percent calculation
    it('[NFR-01] should calculate negative percent correctly', () => {
      const avgBuyPrice = new Decimal('100.00');
      const currentPrice = new Decimal('50.00');

      const result = PortfolioPnLPolicy.calculateHoldingPnLPercent(avgBuyPrice, currentPrice);

      expect(result.toFixed(2)).toBe('-50.00');
    });
  });

  describe('Rounding behavior', () => {
    // [NFR-01] toFixed(2) consistency
    it('[NFR-01] should consistently round to 2 decimal places', () => {
      const value = new Decimal('123.456');

      expect(value.toFixed(2)).toBe('123.46');
    });

    // [NFR-01] Decimal.js uses round half up (not banker's rounding)
    it('[NFR-01] should round 0.5 correctly (round half up)', () => {
      const value = new Decimal('100.125');

      expect(value.toFixed(2)).toBe('100.13');
    });

    // [NFR-01] Edge case: 0.125 should round to 0.13
    it('[NFR-01] should handle rounding edge cases', () => {
      const value = new Decimal('0.125');

      expect(value.toFixed(2)).toBe('0.13');
    });
  });

  describe('Complex portfolio scenarios', () => {
    // [NFR-01] Complex portfolio with many holdings
    it('[NFR-01] should calculate complex portfolio accurately', () => {
      const holdings = [
        new Holding({
          id: 'hold-1',
          customer_id: 'cust-001',
          symbol: 'AAPL',
          quantity: 100,
          avg_buy_price: new Decimal('120.50'),
          created_at: new Date()
        }),
        new Holding({
          id: 'hold-2',
          customer_id: 'cust-001',
          symbol: 'MSFT',
          quantity: 50,
          avg_buy_price: new Decimal('280.75'),
          created_at: new Date()
        }),
        new Holding({
          id: 'hold-3',
          customer_id: 'cust-001',
          symbol: 'GOOG',
          quantity: 25,
          avg_buy_price: new Decimal('2500.00'),
          created_at: new Date()
        })
      ];

      const totalInvested = PortfolioPnLPolicy.calculateTotalInvested(holdings);
      const prices = new Map([
        ['AAPL', new Decimal('145.00')],
        ['MSFT', new Decimal('310.00')],
        ['GOOG', new Decimal('2800.00')]
      ]);
      const currentValue = PortfolioPnLPolicy.calculateCurrentValue(holdings, prices);

      expect(totalInvested.toFixed(2)).toBe('88587.50');
      expect(currentValue.toFixed(2)).toBe('100000.00');

      const absolutePnL = PortfolioPnLPolicy.calculateAbsolutePnL(currentValue, totalInvested);
      expect(absolutePnL.toFixed(2)).toBe('11412.50');

      const percentPnL = PortfolioPnLPolicy.calculatePercentPnL(absolutePnL, totalInvested);
      expect(parseFloat(percentPnL.toFixed(2))).toBeCloseTo(12.88, 1);
    });
  });
});
