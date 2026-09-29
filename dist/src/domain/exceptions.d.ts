export declare class DomainException extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare class RoleAccessDeniedException extends DomainException {
    constructor(message?: string);
}
export declare class InvalidUserStateException extends DomainException {
    constructor(message: string);
}
export declare class UserNotFoundException extends DomainException {
    constructor(userId: string);
}
export declare class DuplicateEmailException extends DomainException {
    constructor(email: string);
}
export declare class InvalidPasswordException extends DomainException {
    constructor(message?: string);
}
export declare class WatchlistLimitExceededException extends DomainException {
    constructor(customerId: string, currentCount?: number);
}
export declare class WatchlistUpdateException extends DomainException {
    constructor(message: string);
}
export declare class WatchlistNotFoundException extends DomainException {
    constructor(watchlistId: string);
}
export declare class StockNotFoundException extends DomainException {
    constructor(symbol: string);
}
export declare class StockAlreadyExistsException extends DomainException {
    constructor(symbol: string);
}
export declare class HardDeleteNotAllowedException extends DomainException {
    constructor(entity?: string);
}
export declare class PortfolioException extends DomainException {
    constructor(message: string);
}
export declare class InsufficientFundsException extends DomainException {
    readonly required: string;
    readonly available: string;
    constructor(message?: string, required?: string, available?: string);
}
export declare class InvalidOrderStateException extends DomainException {
    constructor(message: string);
}
export declare class OrderNotFoundException extends DomainException {
    constructor(orderId: string);
}
