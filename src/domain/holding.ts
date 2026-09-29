import Decimal from 'decimal.js';

export interface HoldingEntity {
  id: string;
  customer_id: string;
  symbol: string;
  quantity: number;
  avg_buy_price: Decimal;
  created_at: Date;
}

export class Holding implements HoldingEntity {
  id: string;
  customer_id: string;
  symbol: string;
  quantity: number;
  avg_buy_price: Decimal;
  created_at: Date;

  constructor(props: HoldingEntity) {
    this.id = props.id;
    this.customer_id = props.customer_id;
    this.symbol = props.symbol;
    this.quantity = props.quantity;
    this.avg_buy_price = props.avg_buy_price instanceof Decimal
      ? props.avg_buy_price
      : new Decimal(props.avg_buy_price);
    this.created_at = props.created_at;
  }
}
