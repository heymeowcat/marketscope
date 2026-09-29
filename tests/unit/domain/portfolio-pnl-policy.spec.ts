import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { PortfolioPnLPolicy } from '../../../src/domain/portfolio-pnl-policy';
import { Holding } from '../../../src/domain/holding';

// [AC-09] [NFR-01] Test suite for P&L calculation using fixed-point Decimal.js
describe('PortfolioPnLPolicy', () => {
  // [AC-09-A] Portfolio with multiple profitable holdings
  describe('calculateTotalInvested', () => {
    it('[AC-09-A] should sum quantity × avg_buy_price for all holdings', () => {
      const holdings = [
        new Holding({
          id: 'hold-1',
          customer_id: 'cust-001',
          symbol: 'AAPL',
          quantity: 10,
          avg_buy_price: new Decimal('150.00'),
          created_at: new Date()
        }),
        new Holding({
          id: 'hold-2',
          customer_id: 'cust-001',
          symbol: 'MSFT',
          quantity: 5,
          avg_buy_price: new Decimal('300.00'),
          created_at: new Date()
        })
      ];

      const result = PortfolioPnLPolicy.calculateTotalInvested(holdings);

      expect(result.toFixed(2)).toBe('3000.00');
    });

    it('[AC-09-A] should return 0.00 for empty holdings', () => {
      const result = PortfolioPnLPolicy.calculateTotalInvested([]);

      expect(result.toFixed(2)).toBe('0.00');
    });

    it('[NFR-01] should use Decimal arithmetic (no floating-point)', () => {
      const holdings = [
        new Holding({
          id: 'hold-1',
          customer_id: 'cust-001',
          symbol: 'TEST',
          quantity: 3,
          avg_buy_price: new Decimal('10.33'),
          created_at: new Date()
        })
      ];

      const result = PortfolioPnLPolicy.calculateTotalInvested(holdings);

      expect(result.toFixed(2)).toBe('30.99');
    });
  });

  describe('calculateCurrentValue', () => {
    it('[AC-09-A] should sum quantity × current_price for all holdings', () => {
      const holdings = [
        new Holding({
          id: 'hold-1',
          customer_id: 'cust-001',
          symbol: 'AAPL',
          quantity: 10,
          avg_buy_price: new Decimal('150.00'),
          created_at: new Date()
        }),
        new Holding({
          id: 'hold-2',
          customer_id: 'cust-001',
          symbol: 'MSFT',
          quantity: 5,
          avg_buy_price: new Decimal('300.00'),
          created_at: new Date()
        })
      ];

      const prices = new Map([
        ['AAPL', new Decimal('180.00')],
        ['MSFT', new Decimal('360.00')]
      ]);

      const result = PortfolioPnLPolicy.calculateCurrentValue(holdings, prices);

      expect(result.toFixed(2)).toBe('3600.00');
    });

    it('[AC-09-A] should return 0.00 for empty holdings', () => {
      const prices = new Map();
      const result = PortfolioPnLPolicy.calculateCurrentValue([], prices);

      expect(result.toFixed(2)).toBe('0.00');
    });

    it('[NFR-01] should use Decimal arithmetic for current value calculation', () => {
      const holdings = [
        new Holding({
          id: 'hold-1',
          customer_id: 'cust-001',
          symbol: 'TEST',
          quantity: 7,
          avg_buy_price: new Decimal('10.00'),
          created_at: new Date()
        })
      ];

      const prices = new Map([
        ['TEST', new Decimal('15.50')]
      ]);

      const result = PortfolioPnLPolicy.calculateCurrentValue(holdings, prices);

      expect(result.toFixed(2)).toBe('108.50');
    });
  });

  describe('calculateAbsolutePnL', () => {
    it('[AC-09-A] should return current_value - total_invested', () => {
      const currentValue = new Decimal('3600.00');
      const totalInvested = new Decimal('3000.00');

      const result = PortfolioPnLPolicy.calculateAbsolutePnL(currentValue, totalInvested);

      expect(result.toFixed(2)).toBe('600.00');
    });

    it('[AC-09-A] should handle negative P&L', () => {
      const currentValue = new Decimal('2500.00');
      const totalInvested = new Decimal('3000.00');

      const result = PortfolioPnLPolicy.calculateAbsolutePnL(currentValue, totalInvested);

      expect(result.toFixed(2)).toBe('-500.00');
    });

    it('[AC-09-B] should return 0.00 for empty portfolio', () => {
      const currentValue = new Decimal('0.00');
      const totalInvested = new Decimal('0.00');

      const result = PortfolioPnLPolicy.calculateAbsolutePnL(currentValue, totalInvested);

      expect(result.toFixed(2)).toBe('0.00');
    });

    it('[NFR-01] should use Decimal arithmetic', () => {
      const currentValue = new Decimal('1234.56');
      const totalInvested = new Decimal('1000.00');

      const result = PortfolioPnLPolicy.calculateAbsolutePnL(currentValue, totalInvested);

      expect(result.toFixed(2)).toBe('234.56');
    });
  });

  describe('calculatePercentPnL', () => {
    it('[AC-09-A] should return (absolute_pnl / total_invested) × 100', () => {
      const absolutePnL = new Decimal('600.00');
      const totalInvested = new Decimal('3000.00');

      const result = PortfolioPnLPolicy.calculatePercentPnL(absolutePnL, totalInvested);

      expect(result.toFixed(2)).toBe('20.00');
    });

    it('[AC-09-B] should return 0.00 when total_invested is 0 (no division by zero)', () => {
      const absolutePnL = new Decimal('100.00');
      const totalInvested = new Decimal('0.00');

      const result = PortfolioPnLPolicy.calculatePercentPnL(absolutePnL, totalInvested);

      expect(result.toFixed(2)).toBe('0.00');
    });

    it('[AC-09-A] should handle negative P&L percentage', () => {
      const absolutePnL = new Decimal('-500.00');
      const totalInvested = new Decimal('5000.00');

      const result = PortfolioPnLPolicy.calculatePercentPnL(absolutePnL, totalInvested);

      expect(result.toFixed(2)).toBe('-10.00');
    });

    it('[NFR-01] should use Decimal arithmetic', () => {
      const absolutePnL = new Decimal('333.33');
      const totalInvested = new Decimal('1000.00');

      const result = PortfolioPnLPolicy.calculatePercentPnL(absolutePnL, totalInvested);

      expect(result.toFixed(2)).toBe('33.33');
    });
  });

  describe('calculateHoldingPnL', () => {
    it('[AC-09-C] should return unrealized_pnl for a single holding', () => {
      const quantity = 10;
      const avgBuyPrice = new Decimal('150.00');
      const currentPrice = new Decimal('180.00');

      const result = PortfolioPnLPolicy.calculateHoldingPnL(quantity, avgBuyPrice, currentPrice);

      expect(result.toFixed(2)).toBe('300.00');
    });

    it('[AC-09-C] should handle negative holding P&L', () => {
      const quantity = 5;
      const avgBuyPrice = new Decimal('100.00');
      const currentPrice = new Decimal('80.00');

      const result = PortfolioPnLPolicy.calculateHoldingPnL(quantity, avgBuyPrice, currentPrice);

      expect(result.toFixed(2)).toBe('-100.00');
    });
  });

  describe('calculateHoldingPnLPercent', () => {
    it('[AC-09-C] should return unrealized_pnl_percent for a single holding', () => {
      const avgBuyPrice = new Decimal('150.00');
      const currentPrice = new Decimal('180.00');

      const result = PortfolioPnLPolicy.calculateHoldingPnLPercent(avgBuyPrice, currentPrice);

      expect(result.toFixed(2)).toBe('20.00');
    });

    it('[AC-09-C] should handle negative holding P&L percent', () => {
      const avgBuyPrice = new Decimal('100.00');
      const currentPrice = new Decimal('80.00');

      const result = PortfolioPnLPolicy.calculateHoldingPnLPercent(avgBuyPrice, currentPrice);

      expect(result.toFixed(2)).toBe('-20.00');
    });

    it('[NFR-01] should use Decimal arithmetic', () => {
      const avgBuyPrice = new Decimal('33.33');
      const currentPrice = new Decimal('50.00');

      const result = PortfolioPnLPolicy.calculateHoldingPnLPercent(avgBuyPrice, currentPrice);

      expect(result.toDecimalPlaces(2).toString()).toMatch(/^50\.0[0-9]$/);
    });
  });
});
