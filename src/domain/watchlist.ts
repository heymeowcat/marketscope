export interface WatchlistEntity {
  watchlist_id: string;
  customer_id: string;
  name: string;
  symbols: string[];
  created_at: Date;
}

export class Watchlist implements WatchlistEntity {
  watchlist_id: string;
  customer_id: string;
  name: string;
  symbols: string[];
  created_at: Date;

  constructor(props: WatchlistEntity) {
    this.watchlist_id = props.watchlist_id;
    this.customer_id = props.customer_id;
    this.name = props.name;
    this.symbols = props.symbols;
    this.created_at = props.created_at;
  }
}
