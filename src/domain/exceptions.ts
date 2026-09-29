export class DomainException extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}

export class RoleAccessDeniedException extends DomainException {
  constructor(message: string = 'Role access denied') {
    super(message, 'ROLE_ACCESS_DENIED');
    Object.setPrototypeOf(this, RoleAccessDeniedException.prototype);
  }
}

export class InvalidUserStateException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_USER_STATE');
    Object.setPrototypeOf(this, InvalidUserStateException.prototype);
  }
}

export class UserNotFoundException extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} not found`, 'USER_NOT_FOUND');
    Object.setPrototypeOf(this, UserNotFoundException.prototype);
  }
}

export class DuplicateEmailException extends DomainException {
  constructor(email: string) {
    super(`Email ${email} already exists`, 'EMAIL_ALREADY_EXISTS');
    Object.setPrototypeOf(this, DuplicateEmailException.prototype);
  }
}

export class InvalidPasswordException extends DomainException {
  constructor(message: string = 'Invalid password') {
    super(message, 'INVALID_PASSWORD');
    Object.setPrototypeOf(this, InvalidPasswordException.prototype);
  }
}

export class WatchlistLimitExceededException extends DomainException {
  constructor(customerId: string, currentCount: number = 10) {
    super(
      `Customer ${customerId} has reached the maximum of 10 watchlists`,
      'WATCHLIST_LIMIT_EXCEEDED'
    );
    Object.setPrototypeOf(this, WatchlistLimitExceededException.prototype);
  }
}

export class WatchlistUpdateException extends DomainException {
  constructor(message: string) {
    super(message, 'WATCHLIST_UPDATE_FAILED');
    Object.setPrototypeOf(this, WatchlistUpdateException.prototype);
  }
}

export class WatchlistNotFoundException extends DomainException {
  constructor(watchlistId: string) {
    super(`Watchlist ${watchlistId} not found`, 'WATCHLIST_NOT_FOUND');
    Object.setPrototypeOf(this, WatchlistNotFoundException.prototype);
  }
}

export class StockNotFoundException extends DomainException {
  constructor(symbol: string) {
    super(`Stock symbol ${symbol} not found`, 'STOCK_NOT_FOUND');
    Object.setPrototypeOf(this, StockNotFoundException.prototype);
  }
}

export class StockAlreadyExistsException extends DomainException {
  constructor(symbol: string) {
    super(`Stock symbol ${symbol} already exists`, 'STOCK_ALREADY_EXISTS');
    Object.setPrototypeOf(this, StockAlreadyExistsException.prototype);
  }
}

export class HardDeleteNotAllowedException extends DomainException {
  constructor(entity: string = 'Stock') {
    super(`Hard delete of ${entity} is not allowed. Use soft-delete instead.`, 'HARD_DELETE_NOT_ALLOWED');
    Object.setPrototypeOf(this, HardDeleteNotAllowedException.prototype);
  }
}

export class PortfolioException extends DomainException {
  constructor(message: string) {
    super(message, 'PORTFOLIO_ERROR');
    Object.setPrototypeOf(this, PortfolioException.prototype);
  }
}

export class InsufficientFundsException extends DomainException {
  public readonly required: string;
  public readonly available: string;

  constructor(message: string = 'Insufficient funds for this order', required?: string, available?: string) {
    super(message, 'INSUFFICIENT_FUNDS');
    this.required = required || 'unknown';
    this.available = available || 'unknown';
    Object.setPrototypeOf(this, InsufficientFundsException.prototype);
  }
}

export class InvalidOrderStateException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_ORDER_STATE');
    Object.setPrototypeOf(this, InvalidOrderStateException.prototype);
  }
}

export class OrderNotFoundException extends DomainException {
  constructor(orderId: string) {
    super(`Order ${orderId} not found`, 'ORDER_NOT_FOUND');
    Object.setPrototypeOf(this, OrderNotFoundException.prototype);
  }
}
