import Decimal from 'decimal.js';
import { Holding } from './holding';
import { GainerLoserItem } from './gainer-loser-item';

export interface GainersLosersResult {
  gainers: GainerLoserItem[];
  losers: GainerLoserItem[];
}

export class StatsAggregatorRule {
  private static readonly MAX_GAINERS = 5;
  private static readonly MAX_LOSERS = 5;

  static aggregateGainersLosers(
    holdings: Holding[],
    priceMap: Map<string, Decimal>
  ): GainersLosersResult {
    if (holdings.length === 0) {
      return { gainers: [], losers: [] };
    }

    const items = holdings
      .map(holding => this.createGainerLoserItem(holding, priceMap))
      .filter(item => item !== null) as GainerLoserItem[];

    const gainers = items
      .filter(item => item.gain_percent.greaterThanOrEqualTo(0))
      .sort((a, b) => b.gain_percent.minus(a.gain_percent).toNumber())
      .slice(0, this.MAX_GAINERS);

    const losers = items
      .filter(item => item.gain_percent.lessThan(0))
      .sort((a, b) => a.gain_percent.minus(b.gain_percent).toNumber())
      .slice(0, this.MAX_LOSERS);

    return { gainers, losers };
  }

  private static createGainerLoserItem(
    holding: Holding,
    priceMap: Map<string, Decimal>
  ): GainerLoserItem | null {
    const currentPrice = priceMap.get(holding.symbol);
    if (!currentPrice) {
      return null;
    }

    const gainPercent = this.calculateGainPercent(holding.avg_buy_price, currentPrice);

    return new GainerLoserItem({
      symbol: holding.symbol,
      gain_percent: gainPercent,
      current_price: currentPrice,
      avg_buy_price: holding.avg_buy_price
    });
  }

  private static calculateGainPercent(avgBuyPrice: Decimal, currentPrice: Decimal): Decimal {
    if (avgBuyPrice.isZero()) {
      return new Decimal('0');
    }
    const change = currentPrice.minus(avgBuyPrice);
    return change.dividedBy(avgBuyPrice).times(new Decimal('100'));
  }
}
