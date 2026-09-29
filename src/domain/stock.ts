import Decimal from 'decimal.js';

export enum StockStatus {
  ACTIVE = 'ACTIVE',
  DELISTED = 'DELISTED'
}

export interface StockEntity {
  symbol: string;
  company_name: string;
  sector: string;
  exchange: string;
  status: StockStatus;
  current_price: Decimal;
  created_at: Date;
  delisted_at: Date | null;
}

export interface CreateStockInput {
  symbol: string;
  company_name: string;
  sector: string;
  exchange: string;
  initial_price: string;
}

export interface UpdateStockInput {
  company_name?: string;
  sector?: string;
  exchange?: string;
}

export class Stock implements StockEntity {
  symbol: string;
  company_name: string;
  sector: string;
  exchange: string;
  status: StockStatus;
  current_price: Decimal;
  created_at: Date;
  delisted_at: Date | null;

  constructor(props: StockEntity) {
    this.symbol = props.symbol;
    this.company_name = props.company_name;
    this.sector = props.sector;
    this.exchange = props.exchange;
    this.status = props.status;
    this.current_price = props.current_price instanceof Decimal
      ? props.current_price
      : new Decimal(props.current_price);
    this.created_at = props.created_at;
    this.delisted_at = props.delisted_at;
  }
}
