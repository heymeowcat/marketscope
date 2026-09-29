import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import { IStockRepository } from '../repositories/stock-repository';
import { IPriceHistoryRepository } from '../repositories/price-history-repository';

export interface MarketDataServiceDeps {
  stockRepository: IStockRepository;
  priceHistoryRepository: IPriceHistoryRepository;
}

export class MarketDataService {
  private stockRepository: IStockRepository;
  private priceHistoryRepository: IPriceHistoryRepository;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private readonly TICK_INTERVAL_MS = 5000;
  private readonly MAX_DELTA_PERCENT = new Decimal('1.5');

  constructor(deps: MarketDataServiceDeps) {
    this.stockRepository = deps.stockRepository;
    this.priceHistoryRepository = deps.priceHistoryRepository;
  }

  startMarketDataFeed(): void {
    if (this.tickInterval) {
      return; // Already running
    }

    this.tickInterval = setInterval(() => {
      this.tickAllPrices().catch(err => {
        console.error('Market data tick error:', err);
      });
    }, this.TICK_INTERVAL_MS);
  }

  stopMarketDataFeed(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private async tickAllPrices(): Promise<void> {
    const stocks = await this.stockRepository.findAll(1000, 0);

    for (const stock of stocks) {
      // Skip delisted stocks
      if (stock.status === 'DELISTED') {
        continue;
      }

      // Calculate random walk delta [-1.5%, +1.5%]
      const deltaPercent = this.randomWalkDelta();
      const currentPrice = stock.current_price instanceof Decimal
        ? stock.current_price
        : new Decimal(stock.current_price as any);

      // Apply delta with proper Decimal math (NFR-01)
      const priceChange = currentPrice.times(deltaPercent).dividedBy(100);
      const newPrice = currentPrice.plus(priceChange).toDecimalPlaces(4);

      // Update stock price
      await this.stockRepository.updatePrice(stock.symbol, newPrice);

      // Record in history
      await this.priceHistoryRepository.append({
        id: uuidv4(),
        symbol: stock.symbol,
        price: newPrice,
        timestamp: new Date()
      });
    }
  }

  private randomWalkDelta(): number {
    // Random walk between -1.5% and +1.5%
    const min = -1.5;
    const max = 1.5;
    return Math.random() * (max - min) + min;
  }
}
