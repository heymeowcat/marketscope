import Decimal from 'decimal.js';
import { Holding } from './holding';

export class PortfolioPnLPolicy {
  static calculateTotalInvested(holdings: Holding[]): Decimal {
    return holdings.reduce((total, holding) => {
      const cost = new Decimal(holding.quantity).times(holding.avg_buy_price);
      return total.plus(cost);
    }, new Decimal('0'));
  }

  static calculateCurrentValue(holdings: Holding[], prices: Map<string, Decimal>): Decimal {
    return holdings.reduce((total, holding) => {
      const currentPrice = prices.get(holding.symbol) || new Decimal('0');
      const value = new Decimal(holding.quantity).times(currentPrice);
      return total.plus(value);
    }, new Decimal('0'));
  }

  static calculateAbsolutePnL(currentValue: Decimal, totalInvested: Decimal): Decimal {
    return currentValue.minus(totalInvested);
  }

  static calculatePercentPnL(absolutePnL: Decimal, totalInvested: Decimal): Decimal {
    if (totalInvested.isZero()) {
      return new Decimal('0');
    }
    return absolutePnL.dividedBy(totalInvested).times(new Decimal('100'));
  }

  static calculateHoldingPnL(quantity: number, avgBuyPrice: Decimal, currentPrice: Decimal): Decimal {
    const totalCost = new Decimal(quantity).times(avgBuyPrice);
    const currentValue = new Decimal(quantity).times(currentPrice);
    return currentValue.minus(totalCost);
  }

  static calculateHoldingPnLPercent(avgBuyPrice: Decimal, currentPrice: Decimal): Decimal {
    const change = currentPrice.minus(avgBuyPrice);
    return change.dividedBy(avgBuyPrice).times(new Decimal('100'));
  }
}
