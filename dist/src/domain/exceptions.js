"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderNotFoundException = exports.InvalidOrderStateException = exports.InsufficientFundsException = exports.PortfolioException = exports.HardDeleteNotAllowedException = exports.StockAlreadyExistsException = exports.StockNotFoundException = exports.WatchlistNotFoundException = exports.WatchlistUpdateException = exports.WatchlistLimitExceededException = exports.InvalidPasswordException = exports.DuplicateEmailException = exports.UserNotFoundException = exports.InvalidUserStateException = exports.RoleAccessDeniedException = exports.DomainException = void 0;
class DomainException extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, DomainException.prototype);
    }
}
exports.DomainException = DomainException;
class RoleAccessDeniedException extends DomainException {
    constructor(message = 'Role access denied') {
        super(message, 'ROLE_ACCESS_DENIED');
        Object.setPrototypeOf(this, RoleAccessDeniedException.prototype);
    }
}
exports.RoleAccessDeniedException = RoleAccessDeniedException;
class InvalidUserStateException extends DomainException {
    constructor(message) {
        super(message, 'INVALID_USER_STATE');
        Object.setPrototypeOf(this, InvalidUserStateException.prototype);
    }
}
exports.InvalidUserStateException = InvalidUserStateException;
class UserNotFoundException extends DomainException {
    constructor(userId) {
        super(`User ${userId} not found`, 'USER_NOT_FOUND');
        Object.setPrototypeOf(this, UserNotFoundException.prototype);
    }
}
exports.UserNotFoundException = UserNotFoundException;
class DuplicateEmailException extends DomainException {
    constructor(email) {
        super(`Email ${email} already exists`, 'EMAIL_ALREADY_EXISTS');
        Object.setPrototypeOf(this, DuplicateEmailException.prototype);
    }
}
exports.DuplicateEmailException = DuplicateEmailException;
class InvalidPasswordException extends DomainException {
    constructor(message = 'Invalid password') {
        super(message, 'INVALID_PASSWORD');
        Object.setPrototypeOf(this, InvalidPasswordException.prototype);
    }
}
exports.InvalidPasswordException = InvalidPasswordException;
class WatchlistLimitExceededException extends DomainException {
    constructor(customerId, currentCount = 10) {
        super(`Customer ${customerId} has reached the maximum of 10 watchlists`, 'WATCHLIST_LIMIT_EXCEEDED');
        Object.setPrototypeOf(this, WatchlistLimitExceededException.prototype);
    }
}
exports.WatchlistLimitExceededException = WatchlistLimitExceededException;
class WatchlistUpdateException extends DomainException {
    constructor(message) {
        super(message, 'WATCHLIST_UPDATE_FAILED');
        Object.setPrototypeOf(this, WatchlistUpdateException.prototype);
    }
}
exports.WatchlistUpdateException = WatchlistUpdateException;
class WatchlistNotFoundException extends DomainException {
    constructor(watchlistId) {
        super(`Watchlist ${watchlistId} not found`, 'WATCHLIST_NOT_FOUND');
        Object.setPrototypeOf(this, WatchlistNotFoundException.prototype);
    }
}
exports.WatchlistNotFoundException = WatchlistNotFoundException;
class StockNotFoundException extends DomainException {
    constructor(symbol) {
        super(`Stock symbol ${symbol} not found`, 'STOCK_NOT_FOUND');
        Object.setPrototypeOf(this, StockNotFoundException.prototype);
    }
}
exports.StockNotFoundException = StockNotFoundException;
class StockAlreadyExistsException extends DomainException {
    constructor(symbol) {
        super(`Stock symbol ${symbol} already exists`, 'STOCK_ALREADY_EXISTS');
        Object.setPrototypeOf(this, StockAlreadyExistsException.prototype);
    }
}
exports.StockAlreadyExistsException = StockAlreadyExistsException;
class HardDeleteNotAllowedException extends DomainException {
    constructor(entity = 'Stock') {
        super(`Hard delete of ${entity} is not allowed. Use soft-delete instead.`, 'HARD_DELETE_NOT_ALLOWED');
        Object.setPrototypeOf(this, HardDeleteNotAllowedException.prototype);
    }
}
exports.HardDeleteNotAllowedException = HardDeleteNotAllowedException;
class PortfolioException extends DomainException {
    constructor(message) {
        super(message, 'PORTFOLIO_ERROR');
        Object.setPrototypeOf(this, PortfolioException.prototype);
    }
}
exports.PortfolioException = PortfolioException;
class InsufficientFundsException extends DomainException {
    required;
    available;
    constructor(message = 'Insufficient funds for this order', required, available) {
        super(message, 'INSUFFICIENT_FUNDS');
        this.required = required || 'unknown';
        this.available = available || 'unknown';
        Object.setPrototypeOf(this, InsufficientFundsException.prototype);
    }
}
exports.InsufficientFundsException = InsufficientFundsException;
class InvalidOrderStateException extends DomainException {
    constructor(message) {
        super(message, 'INVALID_ORDER_STATE');
        Object.setPrototypeOf(this, InvalidOrderStateException.prototype);
    }
}
exports.InvalidOrderStateException = InvalidOrderStateException;
class OrderNotFoundException extends DomainException {
    constructor(orderId) {
        super(`Order ${orderId} not found`, 'ORDER_NOT_FOUND');
        Object.setPrototypeOf(this, OrderNotFoundException.prototype);
    }
}
exports.OrderNotFoundException = OrderNotFoundException;
//# sourceMappingURL=exceptions.js.map