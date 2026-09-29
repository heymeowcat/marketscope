import Decimal from 'decimal.js';
import { Holding } from '../domain/holding';
import { PortfolioPnLPolicy } from '../domain/portfolio-pnl-policy';
import { IHoldingRepository } from '../repositories/holding-repository';
import { IStockRepository } from '../repositories/stock-repository';

export interface PortfolioServiceDeps {
  holdingRepository: IHoldingRepository;
  stockRepository: IStockRepository;
}

export interface PortfolioStatsResponse {
  customer_id: string;
  total_invested: string;
  current_value: string;
  absolute_pnl: string;
  percent_pnl: string;
  currency: string;
}

export interface HoldingWithPnL {
  symbol: string;
  company_name: string;
  quantity: number;
  avg_buy_price: string;
  current_price: string;
  current_value: string;
  unrealized_pnl: string;
  unrealized_pnl_percent: string;
}

export interface PortfolioHoldingsResponse {
  holdings: HoldingWithPnL[];
}

export interface PortfolioSummaryResponse {
  cash_balance: string;
  stats: PortfolioStatsResponse;
  holdings: HoldingWithPnL[];
}

export class PortfolioService {
  private holdingRepository: IHoldingRepository;
  private stockRepository: IStockRepository;

  constructor(deps: PortfolioServiceDeps) {
    this.holdingRepository = deps.holdingRepository;
    this.stockRepository = deps.stockRepository;
  }

  async getStats(customerId: string): Promise<PortfolioStatsResponse> {
    const holdings = await this.holdingRepository.findByCustomerId(customerId);
    const prices = await this.buildPriceMap(holdings);

    const totalInvested = PortfolioPnLPolicy.calculateTotalInvested(holdings);
    const currentValue = PortfolioPnLPolicy.calculateCurrentValue(holdings, prices);
    const absolutePnL = PortfolioPnLPolicy.calculateAbsolutePnL(currentValue, totalInvested);
    const percentPnL = PortfolioPnLPolicy.calculatePercentPnL(absolutePnL, totalInvested);

    return {
      customer_id: customerId,
      total_invested: totalInvested.toFixed(2),
      current_value: currentValue.toFixed(2),
      absolute_pnl: absolutePnL.toFixed(2),
      percent_pnl: percentPnL.toFixed(2),
      currency: 'USD'
    };
  }

  async getHoldings(customerId: string): Promise<PortfolioHoldingsResponse> {
    const holdings = await this.holdingRepository.findByCustomerId(customerId);
    const prices = await this.buildPriceMap(holdings);

    const holdingsWithPnL: HoldingWithPnL[] = [];

    for (const holding of holdings) {
      const stock = await this.stockRepository.findBySymbol(holding.symbol);
      if (!stock) continue;

      const currentPrice = prices.get(holding.symbol) || new Decimal('0');
      const unrealizedPnL = PortfolioPnLPolicy.calculateHoldingPnL(
        holding.quantity,
        holding.avg_buy_price,
        currentPrice
      );
      const unrealizedPnLPercent = PortfolioPnLPolicy.calculateHoldingPnLPercent(
        holding.avg_buy_price,
        currentPrice
      );

      const currentValue = new Decimal(holding.quantity).times(currentPrice);

      holdingsWithPnL.push({
        symbol: holding.symbol,
        company_name: stock.company_name,
        quantity: holding.quantity,
        avg_buy_price: holding.avg_buy_price.toFixed(2),
        current_price: currentPrice.toFixed(2),
        current_value: currentValue.toFixed(2),
        unrealized_pnl: unrealizedPnL.toFixed(2),
        unrealized_pnl_percent: unrealizedPnLPercent.toFixed(2)
      });
    }

    return { holdings: holdingsWithPnL };
  }

  async getSummary(customerId: string, cashBalance: Decimal): Promise<PortfolioSummaryResponse> {
    const stats = await this.getStats(customerId);
    const holdingsResponse = await this.getHoldings(customerId);

    return {
      cash_balance: cashBalance.toFixed(2),
      stats,
      holdings: holdingsResponse.holdings
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
}
