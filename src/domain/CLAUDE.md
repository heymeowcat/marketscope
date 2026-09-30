# Domain Layer Guidelines (src/domain/CLAUDE.md)

## 1. Domain Purity
- The domain layer is the core of MarketScope. It encapsulates business entities, domain rules, state machines, and invariants.
- **Zero Framework Dependencies**: Do NOT import Express, database drivers, ORMs, or network libraries in `src/domain/`.
- Permitted dependencies: Standard library and `decimal.js` for fixed-point math.

## 2. Mandatory Rules & Invariants
- **NFR-01 (Fixed-Point Financial Math)**:
  - All operations on currency, prices, quantities, and P&L must be computed using `Decimal.js`.
  - Native JavaScript floating point arithmetic (`number`, `+`, `-`, `*`, `/`) is strictly forbidden on monetary values.
- **AC-07 (Order State Machine)**:
  - Valid transitions: `PENDING` -> `EXECUTED` | `CANCELLED` | `REJECTED`.
  - Illegal transitions throw `InvalidOrderStateException`.
- **AC-08 (Cash Balance Guard)**:
  - BUY order must verify `available_cash >= quote_price * quantity`.
  - Failure raises `InsufficientFundsException`.
- **AC-04 & AC-05 (Watchlist Rules)**:
  - Max 10 watchlists per customer (`WatchlistLimitExceededException`).
  - Creation requires >= 1 symbol.
  - Partial updates are rejected with `WatchlistUpdateException`.
- **AC-09 & AC-10 (Portfolio & Analytics Math)**:
  - Implement deterministic formulas in `PortfolioPnLPolicy` and `StatsAggregatorRule`.

## 3. Canonical Domain Exceptions Checklist (`src/domain/exceptions.ts`)
All domain exceptions extend `DomainException` and MUST be exported from `src/domain/exceptions.ts`:
- `HardDeleteNotAllowedException` — Block physical deletion of stocks / trade records (AC-03)
- `StockNotFoundException`, `StockAlreadyExistsException`, `InvalidStockPriceException` — Catalog rules (AC-03)
- `InvalidOrderStateException` — Order state machine illegal transitions (AC-07)
- `InsufficientFundsException` — Cash balance guard with `required` and `available` fields (AC-08)
- `WatchlistLimitExceededException` — Max 10 watchlists per customer (AC-04)
- `WatchlistUpdateException` — Watchlist atomic update failure (AC-05)
- `PortfolioException` — Valuation and P&L errors (AC-09)
- `UnauthorizedRoleException` — Role boundary violations (AC-02, NFR-04)

## 4. Canonical Entity Contracts & Enums
- **User (`src/domain/user.ts`)**:
  - Properties: `id` (never `userId`), `email`, `passwordHash` (never `hashed_password`), `role`, `status`, `cashBalance`, `createdAt`, `updatedAt`.
  - Enums: `UserRole` (`CUSTOMER`, `ADMIN`, `SUSPENDED`), `UserStatus` (`ACTIVE`, `INACTIVE` — never `'ACTIVATED'`).
- **Stock (`src/domain/stock.ts`)**:
  - Properties: `symbol`, `companyName`, `currentPrice: Decimal`, `status`, `sector`, `exchange`.
  - Enums: `StockStatus` (`ACTIVE`, `DELISTED` — soft-deleted).
- **Order (`src/domain/order.ts`)**:
  - Enums: `OrderSide` (`BUY`, `SELL`), `OrderType` (`MARKET`, `LIMIT`), `OrderStatus` (`PENDING`, `EXECUTED`, `CANCELLED`, `REJECTED`).
