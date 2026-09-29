import { WatchlistLimitExceededException } from './exceptions';

export class WatchlistLimitRule {
  private static readonly MAX_WATCHLISTS_PER_CUSTOMER = 10;

  enforce(customerId: string, currentWatchlistCount: number): void {
    if (currentWatchlistCount >= WatchlistLimitRule.MAX_WATCHLISTS_PER_CUSTOMER) {
      throw new WatchlistLimitExceededException(customerId, currentWatchlistCount);
    }
  }
}
