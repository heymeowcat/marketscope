import React from 'react';
import './Dashboard.css';

interface PortfolioStats {
  totalInvested: string;
  currentValue: string;
  absolutePnL: string;
  percentPnL: string;
}

interface DashboardProps {
  stats?: PortfolioStats;
  loading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats = {
    totalInvested: '18500.00',
    currentValue: '21200.50',
    absolutePnL: '2700.50',
    percentPnL: '14.59'
  },
  loading = false
}) => {
  const isPositive = parseFloat(stats.absolutePnL) >= 0;

  return (
    <div className="dashboard" data-testid="portfolio-dashboard">
      <div className="dashboard-header">
        <h1>Portfolio Overview</h1>
        <p className="last-updated">Last updated: just now</p>
      </div>

      <div className="stats-grid">
        {/* Total Invested Card */}
        <div className="stat-card" data-testid="total-invested-card">
          <div className="stat-label">Total Invested</div>
          <div className="stat-value">${stats.totalInvested}</div>
          <div className="stat-subtext">Cumulative cost basis</div>
        </div>

        {/* Current Value Card */}
        <div className="stat-card" data-testid="current-value-card">
          <div className="stat-label">Current Value</div>
          <div className="stat-value">${stats.currentValue}</div>
          <div className="stat-subtext">Market valuation</div>
        </div>

        {/* Absolute P&L Card */}
        <div className={`stat-card ${isPositive ? 'positive' : 'negative'}`} data-testid="pnl-card">
          <div className="stat-label">Absolute P&L</div>
          <div className={`stat-value ${isPositive ? 'gain' : 'loss'}`}>
            {isPositive ? '+' : ''} ${stats.absolutePnL}
          </div>
          <div className="stat-subtext">Unrealized gain/loss</div>
        </div>

        {/* Percentage P&L Card */}
        <div className={`stat-card ${isPositive ? 'positive' : 'negative'}`} data-testid="percent-pnl-card">
          <div className="stat-label">Return %</div>
          <div className={`stat-value ${isPositive ? 'gain' : 'loss'}`}>
            {isPositive ? '+' : ''} {stats.percentPnL}%
          </div>
          <div className="stat-subtext">Percentage return</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn primary" data-testid="browse-stocks-btn">
          Browse Stocks
        </button>
        <button className="action-btn secondary" data-testid="manage-watchlists-btn">
          Manage Watchlists
        </button>
        <button className="action-btn primary" data-testid="place-order-btn">
          Place Order
        </button>
      </div>
    </div>
  );
};
