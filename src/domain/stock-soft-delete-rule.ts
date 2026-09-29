import { HardDeleteNotAllowedException } from './exceptions';
import { Stock, StockStatus } from './stock';

export class StockSoftDeleteRule {
  static validateNoHardDelete(query: string): void {
    const normalizedQuery = query.trim().toUpperCase();
    // Check if this is a DELETE statement targeting stocks table
    const deletePattern = /^\s*DELETE\s+FROM\s+(stocks?)\s*/i;
    if (deletePattern.test(normalizedQuery)) {
      throw new HardDeleteNotAllowedException(
        'Stocks must be soft-deleted via status update, never physically removed'
      );
    }
  }

  static softDelete(stock: Stock): Stock {
    return new Stock({
      ...stock,
      status: StockStatus.DELISTED,
      delisted_at: new Date()
    });
  }

  static isDelisted(stock: Stock): boolean {
    return stock.status === StockStatus.DELISTED;
  }
}
