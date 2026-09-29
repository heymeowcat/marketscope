import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { StatsAggregatorRule } from '../../../src/domain/stats-aggregator-rule';
import { Holding } from '../../../src/domain/holding';

// [AC-10] Unit tests for gainer/loser aggregation logic
describe('StatsAggregatorRule', () => {
  describe('aggregateGainersLosers', () => {
    // [AC-10-A] Extract gainers and losers from holdings
    it('[AC-10-A] should identify gainers and losers correctly', () => {
      const holdings: Holding[] = [
        new Holding({
          id: '1',
          customer_id: 'cust-001',
          symbol: 'NVDA',
          quantity: 10,
          avg_buy_price: new Decimal('100.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '2',
          customer_id: 'cust-001',
          symbol: 'AAPL',
          quantity: 10,
          avg_buy_price: new Decimal('150.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '3',
          customer_id: 'cust-001',
          symbol: 'TSLA',
          quantity: 10,
          avg_buy_price: new Decimal('250.00'),
          created_at: new Date()
        })
      ];

      const priceMap = new Map([
        ['NVDA', new Decimal('145.20')],
        ['AAPL', new Decimal('180.00')],
        ['TSLA', new Decimal('233.75')]
      ]);

      const result = StatsAggregatorRule.aggregateGainersLosers(holdings, priceMap);

      expect(result.gainers).toHaveLength(2);
      expect(result.losers).toHaveLength(1);

      expect(result.gainers[0].symbol).toBe('NVDA');
      expect(result.gainers[1].symbol).toBe('AAPL');
      expect(result.losers[0].symbol).toBe('TSLA');
    });

    // [AC-10-A] Gainers sorted descending by gain_percent
    it('[AC-10-A] should sort gainers in descending order by gain_percent', () => {
      const holdings: Holding[] = [
        new Holding({
          id: '1',
          customer_id: 'cust-001',
          symbol: 'STOCK_A',
          quantity: 10,
          avg_buy_price: new Decimal('100.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '2',
          customer_id: 'cust-001',
          symbol: 'STOCK_B',
          quantity: 10,
          avg_buy_price: new Decimal('100.00'),
          created_at: new Date()
        })
      ];

      const priceMap = new Map([
        ['STOCK_A', new Decimal('120.00')], // +20%
        ['STOCK_B', new Decimal('135.00')] // +35%
      ]);

      const result = StatsAggregatorRule.aggregateGainersLosers(holdings, priceMap);

      expect(result.gainers[0].symbol).toBe('STOCK_B');
      expect(result.gainers[1].symbol).toBe('STOCK_A');
    });

    // [AC-10-A] Losers sorted ascending (most negative first)
    it('[AC-10-A] should sort losers in ascending order by gain_percent (most negative first)', () => {
      const holdings: Holding[] = [
        new Holding({
          id: '1',
          customer_id: 'cust-001',
          symbol: 'STOCK_A',
          quantity: 10,
          avg_buy_price: new Decimal('150.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '2',
          customer_id: 'cust-001',
          symbol: 'STOCK_B',
          quantity: 10,
          avg_buy_price: new Decimal('150.00'),
          created_at: new Date()
        })
      ];

      const priceMap = new Map([
        ['STOCK_A', new Decimal('141.00')], // -6%
        ['STOCK_B', new Decimal('116.25')] // -22.5%
      ]);

      const result = StatsAggregatorRule.aggregateGainersLosers(holdings, priceMap);

      expect(result.losers[0].symbol).toBe('STOCK_B');
      expect(result.losers[1].symbol).toBe('STOCK_A');
    });

    // [AC-10] Max 5 gainers
    it('[AC-10] should limit gainers to top 5', () => {
      const holdings: Holding[] = [];
      for (let i = 0; i < 10; i++) {
        holdings.push(
          new Holding({
            id: `${i}`,
            customer_id: 'cust-001',
            symbol: `STOCK_${i}`,
            quantity: 10,
            avg_buy_price: new Decimal('100.00'),
            created_at: new Date()
          })
        );
      }

      const priceMap = new Map();
      for (let i = 0; i < 10; i++) {
        priceMap.set(`STOCK_${i}`, new Decimal((100 + i * 5).toString()));
      }

      const result = StatsAggregatorRule.aggregateGainersLosers(holdings, priceMap);

      expect(result.gainers).toHaveLength(5);
    });

    // [AC-10] Max 5 losers
    it('[AC-10] should limit losers to bottom 5', () => {
      const holdings: Holding[] = [];
      for (let i = 0; i < 10; i++) {
        holdings.push(
          new Holding({
            id: `${i}`,
            customer_id: 'cust-001',
            symbol: `STOCK_${i}`,
            quantity: 10,
            avg_buy_price: new Decimal('100.00'),
            created_at: new Date()
          })
        );
      }

      const priceMap = new Map();
      for (let i = 0; i < 10; i++) {
        priceMap.set(`STOCK_${i}`, new Decimal((100 - i * 5).toString()));
      }

      const result = StatsAggregatorRule.aggregateGainersLosers(holdings, priceMap);

      expect(result.losers).toHaveLength(5);
    });

    // [AC-10-B] Empty holdings
    it('[AC-10-B] should return empty arrays for no holdings', () => {
      const result = StatsAggregatorRule.aggregateGainersLosers([], new Map());

      expect(result.gainers).toEqual([]);
      expect(result.losers).toEqual([]);
    });

    // [AC-10] Exact AC-10-A scenario
    it('[AC-10-A] should handle exact AC-10-A scenario (8 holdings)', () => {
      const holdings: Holding[] = [
        new Holding({
          id: '1',
          customer_id: 'cust-001',
          symbol: 'NVDA',
          quantity: 10,
          avg_buy_price: new Decimal('100.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '2',
          customer_id: 'cust-001',
          symbol: 'AAPL',
          quantity: 10,
          avg_buy_price: new Decimal('150.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '3',
          customer_id: 'cust-001',
          symbol: 'GOOGL',
          quantity: 10,
          avg_buy_price: new Decimal('150.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '4',
          customer_id: 'cust-001',
          symbol: 'MSFT',
          quantity: 10,
          avg_buy_price: new Decimal('300.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '5',
          customer_id: 'cust-001',
          symbol: 'AMZN',
          quantity: 10,
          avg_buy_price: new Decimal('180.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '6',
          customer_id: 'cust-001',
          symbol: 'META',
          quantity: 10,
          avg_buy_price: new Decimal('200.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '7',
          customer_id: 'cust-001',
          symbol: 'TSLA',
          quantity: 10,
          avg_buy_price: new Decimal('250.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '8',
          customer_id: 'cust-001',
          symbol: 'INTC',
          quantity: 10,
          avg_buy_price: new Decimal('30.00'),
          created_at: new Date()
        }),
        new Holding({
          id: '9',
          customer_id: 'cust-001',
          symbol: 'AMD',
          quantity: 10,
          avg_buy_price: new Decimal('150.00'),
          created_at: new Date()
        })
      ];

      const priceMap = new Map([
        ['NVDA', new Decimal('145.20')],
        ['AAPL', new Decimal('180.00')],
        ['GOOGL', new Decimal('172.65')],
        ['MSFT', new Decimal('337.20')],
        ['AMZN', new Decimal('194.40')],
        ['META', new Decimal('208.40')],
        ['TSLA', new Decimal('233.75')],
        ['INTC', new Decimal('24.54')],
        ['AMD', new Decimal('116.25')]
      ]);

      const result = StatsAggregatorRule.aggregateGainersLosers(holdings, priceMap);

      expect(result.gainers).toHaveLength(5);
      expect(result.gainers.map(g => g.symbol)).toEqual(['NVDA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN']);

      expect(result.losers).toHaveLength(3);
      expect(result.losers.map(l => l.symbol)).toEqual(['AMD', 'INTC', 'TSLA']);

      // Verify exact gain_percent values
      expect(result.gainers[0].gain_percent.toFixed(2)).toBe('45.20');
      expect(result.gainers[1].gain_percent.toFixed(2)).toBe('20.00');
      expect(result.gainers[2].gain_percent.toFixed(2)).toBe('15.10');
      expect(result.gainers[3].gain_percent.toFixed(2)).toBe('12.40');
      expect(result.gainers[4].gain_percent.toFixed(2)).toBe('8.00');

      expect(result.losers[0].gain_percent.toFixed(2)).toBe('-22.50');
      expect(result.losers[1].gain_percent.toFixed(2)).toBe('-18.20');
      expect(result.losers[2].gain_percent.toFixed(2)).toBe('-6.50');
    });
  });
});
