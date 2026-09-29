import Decimal from 'decimal.js';

export interface GainerLoserItemProps {
  symbol: string;
  gain_percent: Decimal;
  current_price: Decimal;
  avg_buy_price: Decimal;
}

export class GainerLoserItem implements GainerLoserItemProps {
  readonly symbol: string;
  readonly gain_percent: Decimal;
  readonly current_price: Decimal;
  readonly avg_buy_price: Decimal;

  constructor(props: GainerLoserItemProps) {
    this.symbol = props.symbol;
    this.gain_percent = props.gain_percent instanceof Decimal
      ? props.gain_percent
      : new Decimal(props.gain_percent);
    this.current_price = props.current_price instanceof Decimal
      ? props.current_price
      : new Decimal(props.current_price);
    this.avg_buy_price = props.avg_buy_price instanceof Decimal
      ? props.avg_buy_price
      : new Decimal(props.avg_buy_price);
  }
}
