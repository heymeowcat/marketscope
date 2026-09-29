import Decimal from 'decimal.js';
import { Holding } from '../domain/holding';

export interface IHoldingRepository {
  create(holding: Holding): Promise<void>;
  findByCustomerId(customerId: string): Promise<Holding[]>;
  findByCustomerAndSymbol(customerId: string, symbol: string): Promise<Holding | null>;
  clear(): Promise<void>;
}

export class HoldingRepository implements IHoldingRepository {
  private holdings: Map<string, Holding> = new Map();

  async create(holding: Holding): Promise<void> {
    this.holdings.set(holding.id, holding);
  }

  async findByCustomerId(customerId: string): Promise<Holding[]> {
    return Array.from(this.holdings.values()).filter(
      h => h.customer_id === customerId
    );
  }

  async findByCustomerAndSymbol(customerId: string, symbol: string): Promise<Holding | null> {
    const holdings = await this.findByCustomerId(customerId);
    const holding = holdings.find(h => h.symbol === symbol);
    return holding || null;
  }

  async clear(): Promise<void> {
    this.holdings.clear();
  }
}
