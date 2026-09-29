import React, { useState, useMemo } from 'react';
import './TradeModal.css';

interface TradeModalProps {
  isOpen?: boolean;
  symbol?: string;
  currentPrice?: string;
  onClose?: () => void;
  onSubmit?: (order: OrderRequest) => void;
  availableCash?: string;
  maxQuantity?: number;
}

interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  quantity: number;
  limitPrice?: string;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen = true,
  symbol = 'AAPL',
  currentPrice = '180.50',
  onClose,
  onSubmit,
  availableCash = '50000.00',
  maxQuantity = 100
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState('1');
  const [limitPrice, setLimitPrice] = useState(currentPrice);
  const [error, setError] = useState('');

  const executionPrice = orderType === 'MARKET' ? parseFloat(currentPrice) : parseFloat(limitPrice);
  const totalCost = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    return (qty * executionPrice).toFixed(2);
  }, [quantity, executionPrice]);

  const canExecute = useMemo(() => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) return false;
    if (side === 'BUY') {
      return parseFloat(totalCost) <= parseFloat(availableCash);
    }
    return qty <= maxQuantity;
  }, [quantity, side, totalCost, availableCash, maxQuantity]);

  const handleSubmit = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (side === 'BUY' && parseFloat(totalCost) > parseFloat(availableCash)) {
      setError(`Insufficient funds. Required: $${totalCost}, Available: $${availableCash}`);
      return;
    }

    const order: OrderRequest = {
      symbol,
      side,
      orderType,
      quantity: parseFloat(quantity),
      ...(orderType === 'LIMIT' && { limitPrice })
    };

    onSubmit?.(order);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" data-testid="trade-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Place Order - {symbol}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Current Price Display */}
          <div className="price-display">
            <span className="label">Current Price</span>
            <span className="price">${currentPrice}</span>
          </div>

          {/* Side Selection */}
          <div className="form-group">
            <label>Side</label>
            <div className="side-toggle">
              <button
                className={`side-btn buy ${side === 'BUY' ? 'active' : ''}`}
                onClick={() => setSide('BUY')}
                data-testid="buy-btn"
              >
                BUY
              </button>
              <button
                className={`side-btn sell ${side === 'SELL' ? 'active' : ''}`}
                onClick={() => setSide('SELL')}
                data-testid="sell-btn"
              >
                SELL
              </button>
            </div>
          </div>

          {/* Order Type Selection */}
          <div className="form-group">
            <label>Order Type</label>
            <div className="order-type-toggle">
              <button
                className={`type-btn ${orderType === 'MARKET' ? 'active' : ''}`}
                onClick={() => setOrderType('MARKET')}
                data-testid="market-btn"
              >
                Market
              </button>
              <button
                className={`type-btn ${orderType === 'LIMIT' ? 'active' : ''}`}
                onClick={() => setOrderType('LIMIT')}
                data-testid="limit-btn"
              >
                Limit
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={e => {
                setQuantity(e.target.value);
                setError('');
              }}
              data-testid="quantity-input"
            />
          </div>

          {/* Limit Price Input (if LIMIT order) */}
          {orderType === 'LIMIT' && (
            <div className="form-group">
              <label htmlFor="limitPrice">Limit Price</label>
              <input
                id="limitPrice"
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={e => setLimitPrice(e.target.value)}
                data-testid="limit-price-input"
              />
            </div>
          )}

          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span>Quantity</span>
              <span>{quantity} shares</span>
            </div>
            <div className="summary-row">
              <span>Price per share</span>
              <span>${executionPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total {side === 'BUY' ? 'Cost' : 'Proceeds'}</span>
              <span className={side === 'BUY' ? 'cost' : 'proceeds'}>
                ${totalCost}
              </span>
            </div>

            {side === 'BUY' && (
              <div className="summary-row">
                <span>Available Cash</span>
                <span className={parseFloat(totalCost) <= parseFloat(availableCash) ? 'success' : 'error'}>
                  ${availableCash}
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message" data-testid="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn primary ${!canExecute ? 'disabled' : ''}`}
            onClick={handleSubmit}
            disabled={!canExecute}
            data-testid="submit-order-btn"
          >
            {side === 'BUY' ? 'Buy' : 'Sell'} {quantity} {symbol}
          </button>
        </div>
      </div>
    </div>
  );
};
