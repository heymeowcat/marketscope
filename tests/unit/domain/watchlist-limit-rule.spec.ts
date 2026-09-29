import { describe, it, expect, beforeEach } from 'vitest';
import { WatchlistLimitExceededException } from '../../../src/domain/exceptions';
import { WatchlistLimitRule } from '../../../src/domain/watchlist-limit-rule';

// [AC-04] Watchlist limit enforcement (max 10 per customer)
describe('WatchlistLimitRule', () => {
  let watchlistLimitRule: WatchlistLimitRule;

  beforeEach(() => {
    watchlistLimitRule = new WatchlistLimitRule();
  });

  describe('enforce', () => {
    // [AC-04] Should allow creation when below limit
    it('[AC-04] should allow watchlist creation when customer has fewer than 10 watchlists', () => {
      const customerId = 'customer-123';
      expect(() => {
        watchlistLimitRule.enforce(customerId, 5);
      }).not.toThrow();
    });

    // [AC-04] Should allow exactly 10 watchlists
    it('[AC-04] should allow exactly 10 watchlists per customer', () => {
      const customerId = 'customer-123';
      expect(() => {
        watchlistLimitRule.enforce(customerId, 9);
      }).not.toThrow();
    });

    // [AC-04] Should reject when at limit
    it('[AC-04] should throw WatchlistLimitExceededException when customer has 10 watchlists', () => {
      const customerId = 'customer-123';
      expect(() => {
        watchlistLimitRule.enforce(customerId, 10);
      }).toThrow(WatchlistLimitExceededException);
    });

    // [AC-04] Should reject when exceeding limit
    it('[AC-04] should throw WatchlistLimitExceededException when customer exceeds 10 watchlists', () => {
      const customerId = 'customer-123';
      expect(() => {
        watchlistLimitRule.enforce(customerId, 11);
      }).toThrow(WatchlistLimitExceededException);
    });
  });
});
