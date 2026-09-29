import React, { useState } from 'react';
import './Watchlists.css';

interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
}

interface WatchlistsProps {
  watchlists?: Watchlist[];
  onCreateWatchlist?: (name: string, symbols: string[]) => void;
  onDeleteWatchlist?: (id: string) => void;
  onAddSymbol?: (watchlistId: string, symbol: string) => void;
  onRemoveSymbol?: (watchlistId: string, symbol: string) => void;
}

export const Watchlists: React.FC<WatchlistsProps> = ({
  watchlists = [
    { id: 'wl-001', name: 'Mega-Cap Tech', symbols: ['AAPL', 'MSFT', 'NVDA', 'AMZN'] },
    { id: 'wl-002', name: 'Cloud & AI', symbols: ['MSFT', 'GOOGL', 'NVDA'] }
  ],
  onCreateWatchlist,
  onDeleteWatchlist,
  onAddSymbol,
  onRemoveSymbol
}) => {
  const [activeTabId, setActiveTabId] = useState(watchlists[0]?.id || '');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSymbols, setNewSymbols] = useState('');
  const [newSymbolInput, setNewSymbolInput] = useState('');

  const activeWatchlist = watchlists.find(w => w.id === activeTabId);

  const handleCreateWatchlist = () => {
    if (newName && newSymbols) {
      const symbols = newSymbols.split(',').map(s => s.trim().toUpperCase());
      onCreateWatchlist?.(newName, symbols);
      setNewName('');
      setNewSymbols('');
      setShowCreateForm(false);
    }
  };

  const handleAddSymbol = () => {
    const symbol = newSymbolInput.trim().toUpperCase();
    if (symbol && activeWatchlist) {
      onAddSymbol?.(activeWatchlist.id, symbol);
      setNewSymbolInput('');
    }
  };

  return (
    <div className="watchlists-container" data-testid="watchlists-view">
      <div className="watchlists-header">
        <h2>My Watchlists</h2>
        <button
          className="add-watchlist-btn"
          data-testid="create-watchlist-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          + New Watchlist
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="create-form" data-testid="create-watchlist-form">
          <input
            type="text"
            placeholder="Watchlist name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            data-testid="watchlist-name-input"
          />
          <input
            type="text"
            placeholder="Symbols (comma-separated, e.g., AAPL, MSFT, NVDA)"
            value={newSymbols}
            onChange={e => setNewSymbols(e.target.value)}
            data-testid="watchlist-symbols-input"
          />
          <div className="form-actions">
            <button
              className="btn primary"
              onClick={handleCreateWatchlist}
              data-testid="create-watchlist-submit"
            >
              Create
            </button>
            <button
              className="btn secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Watchlist Tabs */}
      {watchlists.length > 0 ? (
        <>
          <div className="watchlist-tabs" data-testid="watchlist-tabs">
            {watchlists.map(wl => (
              <button
                key={wl.id}
                className={`tab ${activeTabId === wl.id ? 'active' : ''}`}
                onClick={() => setActiveTabId(wl.id)}
                data-testid={`watchlist-tab-${wl.id}`}
              >
                {wl.name}
                <span className="symbol-count">({wl.symbols.length})</span>
              </button>
            ))}
          </div>

          {/* Active Watchlist Content */}
          {activeWatchlist && (
            <div className="watchlist-content">
              <div className="watchlist-actions">
                <div className="add-symbol">
                  <input
                    type="text"
                    placeholder="Add symbol..."
                    value={newSymbolInput}
                    onChange={e => setNewSymbolInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddSymbol()}
                    data-testid="add-symbol-input"
                  />
                  <button
                    className="btn small"
                    onClick={handleAddSymbol}
                    data-testid="add-symbol-btn"
                  >
                    Add
                  </button>
                </div>
                <button
                  className="btn danger small"
                  onClick={() => onDeleteWatchlist?.(activeWatchlist.id)}
                  data-testid="delete-watchlist-btn"
                >
                  Delete Watchlist
                </button>
              </div>

              {/* Symbols Grid */}
              <div className="symbols-grid" data-testid="watchlist-symbols">
                {activeWatchlist.symbols.map(symbol => (
                  <div key={symbol} className="symbol-card" data-testid={`symbol-card-${symbol}`}>
                    <div className="symbol-name">{symbol}</div>
                    <button
                      className="remove-btn"
                      onClick={() => onRemoveSymbol?.(activeWatchlist.id, symbol)}
                      data-testid={`remove-symbol-${symbol}`}
                      title="Remove symbol"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <p>No watchlists yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};
