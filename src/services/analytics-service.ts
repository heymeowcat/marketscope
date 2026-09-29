import Decimal from 'decimal.js';
import { Holding } from '../domain/holding';
import { StatsAggregatorRule } from '../domain/stats-aggregator-rule';
import { DailyStatsResponse, DailyStatsResponseItem } from '../domain/daily-stats-response';
import { GainerLoserItem } from '../domain/gainer-loser-item';
import { IHoldingRepository } from '../repositories/holding-repository';
import { IStockRepository } from '../repositories/stock-repository';

export interface AnalyticsServiceDeps {
  holdingRepository: IHoldingRepository;
  stockRepository: IStockRepository;
}

export class AnalyticsService {
  private holdingRepository: IHoldingRepository;
  private stockRepository: IStockRepository;

  constructor(deps: AnalyticsServiceDeps) {
    this.holdingRepository = deps.holdingRepository;
    this.stockRepository = deps.stockRepository;
  }

  async getDailyStats(customerId: string): Promise<DailyStatsResponse> {
    const holdings = await this.holdingRepository.findByCustomerId(customerId);
    const priceMap = await this.buildPriceMap(holdings);

    const result = StatsAggregatorRule.aggregateGainersLosers(holdings, priceMap);

    return {
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      gainers: this.formatItems(result.gainers),
      losers: this.formatItems(result.losers)
    };
  }

  private async buildPriceMap(holdings: Holding[]): Promise<Map<string, Decimal>> {
    const priceMap = new Map<string, Decimal>();

    for (const holding of holdings) {
      const stock = await this.stockRepository.findBySymbol(holding.symbol);
      if (stock) {
        priceMap.set(holding.symbol, stock.current_price);
      }
    }

    return priceMap;
  }

  private formatItems(items: GainerLoserItem[]): DailyStatsResponseItem[] {
    return items.map(item => ({
      symbol: item.symbol,
      gain_percent: item.gain_percent.toFixed(2),
      current_price: item.current_price.toFixed(2),
      avg_buy_price: item.avg_buy_price.toFixed(2)
    }));
  }
}
