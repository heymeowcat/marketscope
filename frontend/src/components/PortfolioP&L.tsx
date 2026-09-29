import React, { useState } from 'react';
import './PortfolioP&L.css';

interface Holding {
  symbol: string;
  quantity: number;
  avgBuyPrice: string;
  currentPrice: string;
  currentValue: string;
  unrealizedPnL: string;
  unrealizedPnLPercent: string;
}

interface PortfolioP_LProps {
  holdings?: Holding[];
  totalInvested?: string;
  currentValue?: string;
  absolutePnL?: string;
  percentPnL?: string;
}

export const PortfolioP_L: React.FC<PortfolioP_LProps> = ({
  holdings = [
    {
      symbol: 'AAPL',
      quantity: 10,
      avgBuyPrice: '150.00',
      currentPrice: '180.50',
      currentValue: '1805.00',
      unrealizedPnL: '305.00',
      unrealizedPnLPercent: '20.33'
    },
    {
      symbol: 'MSFT',
      quantity: 5,
      avgBuyPrice: '300.00',
      currentPrice: '420.75',
      currentValue: '2103.75',
      unrealizedPnL: '603.75',
      unrealizedPnLPercent: '40.25'
    },
    {
      symbol: 'NVDA',
      quantity: 20,
      avgBuyPrice: '110.00',
      currentPrice: '125.25',
      currentValue: '2505.00',
      unrealizedPnL: '305.00',
      unrealizedPnLPercent: '13.82'
    }
  ],
  totalInvested = '18500.00',
  currentValue = '21200.50',
  absolutePnL = '2700.50',
  percentPnL = '14.59'
}) => {
  const [sortBy, setSortBy] = useState<'symbol' | 'pnl' | 'value'>('symbol');
  const isPositive = parseFloat(absolutePnL) >= 0;

  const sortedHoldings = [...holdings].sort((a, b) => {
    switch (sortBy) {
      case 'pnl':
        return parseFloat(b.unrealizedPnL) - parseFloat(a.unrealizedPnL);
      case 'value':
        return parseFloat(b.currentValue) - parseFloat(a.currentValue);
      default:
        return a.symbol.localeCompare(b.symbol);
    }
  });

  return (
    <div className="portfolio-pnl" data-testid="portfolio-pnl-view">
      <div className="pnl-header">
        <h2>Holdings & P&L</h2>
        <div className="portfolio-summary">
          <div className="summary-item">
            <span className="label">Total Invested</span>
            <span className="value">${totalInvested}</span>
          </div>
          <div className="summary-item">
            <span className="label">Current Value</span>
            <span className="value">${currentValue}</span>
          </div>
          <div className={`summary-item ${isPositive ? 'positive' : 'negative'}`}>
            <span className="label">Total P&L</span>
            <span className={`value ${isPositive ? 'gain' : 'loss'}`}>
              {isPositive ? '+' : ''} ${absolutePnL} ({percentPnL}%)
            </span>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="controls">
        <div className="sort-buttons">
          <button
            className={`sort-btn ${sortBy === 'symbol' ? 'active' : ''}`}
            onClick={() => setSortBy('symbol')}
            data-testid="sort-symbol"
          >
            Symbol
          </button>
          <button
            className={`sort-btn ${sortBy === 'value' ? 'active' : ''}`}
            onClick={() => setSortBy('value')}
            data-testid="sort-value"
          >
            Value
          </button>
          <button
            className={`sort-btn ${sortBy === 'pnl' ? 'active' : ''}`}
            onClick={() => setSortBy('pnl')}
            data-testid="sort-pnl"
          >
            P&L
          </button>
        </div>
      </div>

      {/* Holdings Table - Desktop */}
      <div className="holdings-table" data-testid="holdings-list">
        <div className="table-header">
          <div className="column symbol">Symbol</div>
          <div className="column quantity">Quantity</div>
          <div className="column price">Avg. Buy Price</div>
          <div className="column price">Current Price</div>
          <div className="column value">Value</div>
          <div className="column pnl">P&L</div>
        </div>

        {sortedHoldings.map(holding => {
          const isPnLPositive = parseFloat(holding.unrealizedPnL) >= 0;
          return (
            <div key={holding.symbol} className="table-row" data-testid={`holding-row-${holding.symbol}`}>
              <div className="column symbol">
                <span className="symbol-badge">{holding.symbol}</span>
              </div>
              <div className="column quantity">{holding.quantity}</div>
              <div className="column price">${holding.avgBuyPrice}</div>
              <div className="column price">${holding.currentPrice}</div>
              <div className="column value">${holding.currentValue}</div>
              <div className={`column pnl ${isPnLPositive ? 'gain' : 'loss'}`}>
                <div className="pnl-amount">{isPnLPositive ? '+' : ''} ${holding.unrealizedPnL}</div>
                <div className="pnl-percent">{isPnLPositive ? '+' : ''} {holding.unrealizedPnLPercent}%</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Holdings Cards - Mobile */}
      <div className="holdings-cards">
        {sortedHoldings.map(holding => {
          const isPnLPositive = parseFloat(holding.unrealizedPnL) >= 0;
          return (
            <div key={holding.symbol} className="holding-card" data-testid={`holding-card-${holding.symbol}`}>
              <div className="card-header">
                <span className="symbol-badge">{holding.symbol}</span>
                <div className={`pnl-badge ${isPnLPositive ? 'positive' : 'negative'}`}>
                  {isPnLPositive ? '+' : ''} {holding.unrealizedPnLPercent}%
                </div>
              </div>

              <div className="card-grid">
                <div className="card-item">
                  <span className="label">Quantity</span>
                  <span className="value">{holding.quantity}</span>
                </div>
                <div className="card-item">
                  <span className="label">Avg. Buy Price</span>
                  <span className="value">${holding.avgBuyPrice}</span>
                </div>
                <div className="card-item">
                  <span className="label">Current Price</span>
                  <span className="value">${holding.currentPrice}</span>
                </div>
                <div className="card-item">
                  <span className="label">Value</span>
                  <span className="value">${holding.currentValue}</span>
                </div>
              </div>

              <div className={`card-pnl ${isPnLPositive ? 'positive' : 'negative'}`}>
                <span className="label">Unrealized P&L</span>
                <span className={`value ${isPnLPositive ? 'gain' : 'loss'}`}>
                  {isPnLPositive ? '+' : ''} ${holding.unrealizedPnL}
                </span>
              </div>

              <button className="action-btn" data-testid={`sell-btn-${holding.symbol}`}>
                Sell {holding.symbol}
              </button>
            </div>
          );
        })}
      </div>

      {holdings.length === 0 && (
        <div className="empty-state">
          <p>No holdings yet. Start trading to build your portfolio!</p>
        </div>
      )}
    </div>
  );
};
