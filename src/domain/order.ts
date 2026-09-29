import Decimal from 'decimal.js';

export enum OrderStatus {
  PENDING = 'PENDING',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT'
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export interface OrderEntity {
  id: string;
  customer_id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limit_price: Decimal | null;
  status: OrderStatus;
  executed_price: Decimal | null;
  created_at: Date;
  executed_at: Date | null;
}

export class Order implements OrderEntity {
  id: string;
  customer_id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limit_price: Decimal | null;
  status: OrderStatus;
  executed_price: Decimal | null;
  created_at: Date;
  executed_at: Date | null;

  constructor(props: OrderEntity) {
    this.id = props.id;
    this.customer_id = props.customer_id;
    this.symbol = props.symbol;
    this.side = props.side;
    this.type = props.type;
    this.quantity = props.quantity;
    this.limit_price = props.limit_price instanceof Decimal
      ? props.limit_price
      : props.limit_price !== null ? new Decimal(props.limit_price) : null;
    this.status = props.status;
    this.executed_price = props.executed_price instanceof Decimal
      ? props.executed_price
      : props.executed_price !== null ? new Decimal(props.executed_price) : null;
    this.created_at = props.created_at;
    this.executed_at = props.executed_at;
  }
}
