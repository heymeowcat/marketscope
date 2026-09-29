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
