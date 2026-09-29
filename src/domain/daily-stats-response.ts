export interface DailyStatsResponseItem {
  symbol: string;
  gain_percent: string;
  current_price: string;
  avg_buy_price: string;
}

export interface DailyStatsResponse {
  customer_id: string;
  timestamp: string;
  gainers: DailyStatsResponseItem[];
  losers: DailyStatsResponseItem[];
}
