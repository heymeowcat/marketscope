# MarketScope — Stock Trading & Portfolio Analytics Platform
## Root Application Specification (specs/app_spec.md)
**Business Case ID:** BC-AINE-006  
**Domain:** FinTech — Capital Markets / Brokerage  
**Platform Version:** 1.0.0  

---

## 1. Executive Summary & System Vision
MarketScope is a high-performance, self-serve retail brokerage and portfolio analytics platform. It provides end-to-end capabilities for customer onboarding, stock catalog browsing, watchlist management, trade order placement (with market/limit lifecycle execution), and real-time portfolio analytics.

The platform is engineered under the **AI-Native Engineering Paradigm**:
- **Zero manual production code**: All production code, tests, and database migrations are generated autonomously by Claude Code agents.
- **Specification is Truth**: The specifications in `specs/` govern all behavior; when code and spec disagree, the spec is the single source of truth.
- **Strict Architectural Invariants**: Fixed-point arithmetic for all financial math, append-only order ledgers, and impenetrable role-based access control.

---

## 2. System Architecture & Layered Boundaries

MarketScope follows a strict 4-tier layered architecture:
```
+-------------------------------------------------------+
|                 Presentation Layer                    |
|        React + Vite Web UI / REST Controllers         |
+---------------------------+---------------------------+
                            | (HTTP / DTOs)
+---------------------------v---------------------------+
|                   Service Layer                       |
|   Orchestration, Transactional Boundaries, Events     |
+---------------------------+---------------------------+
                            | (Domain Entities)
+---------------------------v---------------------------+
|                    Domain Layer                       |
|   Pure Business Rules, Invariants, State Machines     |
|   (Zero external dependencies, Fixed-point math)     |
+---------------------------+---------------------------+
                            | (Persistence Interfaces)
+---------------------------v---------------------------+
|                 Repository Layer                      |
|       Append-Only Ledgers, Soft-Delete Stores         |
+-------------------------------------------------------+
```

### Architectural Layering Rules:
1. **Controllers** only communicate with **Services**. Controllers must NEVER directly access Repositories or the database.
2. **Services** coordinate business operations, enforce transactional atomicity, and delegate business rules to the **Domain** layer.
3. **Domain Entities and Policies** are pure, containing business invariants without framework dependencies.
4. **Repositories** handle persistence. Executed trades and audit records are strictly **append-only**. Stock symbols support soft-delete via status flags only.

---

## 3. Core Acceptance Criteria Matrix

| ID | Criterion | Enforcing Spec | Primary Verification |
|---|---|---|---|
| **AC-01** | Customer can register with email and password; the new account is created in `ACTIVE` state with `role = CUSTOMER` | `specs/user-management_spec.md` | Integration Test: `UserRegistration.spec.ts` |
| **AC-02** | Admin can update a user's role (`CUSTOMER` / `ADMIN` / `SUSPENDED`); the action is audited with actor and timestamp | `specs/user-management_spec.md` | Integration Test: `UserRoleAudit.spec.ts` |
| **AC-03** | Stock catalog supports full CRUD for `ADMIN` role; soft-delete moves a symbol to `DELISTED` / `DELETED` status — symbols are never hard-deleted | `specs/stock-catalog_spec.md` | Integration Test: `StockCatalogAdmin.spec.ts` |
| **AC-04** | Customer can create a watchlist with a name and at least one symbol; a customer may hold a maximum of 10 watchlists | `specs/watchlist_spec.md` | Integration Test: `WatchlistCreation.spec.ts` |
| **AC-05** | Watchlist operations (rename, add or remove symbols, delete) execute atomically — partial updates are rejected with `WatchlistUpdateException` | `specs/watchlist_spec.md` | Integration Test: `WatchlistAtomicUpdate.spec.ts` |
| **AC-06** | Customer can place a market or limit order (`BUY` or `SELL`); the order enters `PENDING` state with a server-side timestamp | `specs/order_spec.md` | Integration Test: `OrderPlacement.spec.ts` |
| **AC-07** | Order lifecycle `PENDING` -> `EXECUTED` / `CANCELLED` / `REJECTED` is enforced; invalid transitions raise `InvalidOrderStateException` | `specs/order_spec.md` | Unit Test: `OrderLifecycleStateMachine.spec.ts` |
| **AC-08** | `BUY` order fails with `InsufficientFundsException` when `quote_price * quantity` exceeds the customer's available cash | `specs/order_spec.md` | Unit/Integration Test: `OrderCashValidation.spec.ts` |
| **AC-09** | Portfolio statistics endpoint returns `total_invested`, `current_value`, `absolute_pnl`, and `percent_pnl` for the requesting customer | `specs/portfolio_spec.md` | Unit Test: `PortfolioPnLMath.spec.ts` |
| **AC-10** | Daily statistics endpoint returns the top 5 gainers and top 5 losers from the requesting customer's current holdings | `specs/analytics_spec.md` | Unit Test: `HoldingsGainersLosers.spec.ts` |

---

## 4. Non-Functional Requirements (NFRs)

| ID | Requirement | Enforcement Mechanism | Verification |
|---|---|---|---|
| **NFR-01** | Price, quantity, and P&L values are computed in fixed-point (`BigDecimal` / `Decimal.js`) — never floating-point | Pre-commit hook: `bigdecimal-financial-check.js` | Unit tests with IEEE 754 precision boundary cases |
| **NFR-02** | Trade records and executed orders are append-only — no edits or deletes post-execution | Repository invariant & Hook: `executed-order-immutability-check.js` | Database constraint test & ArchUnit rule |
| **NFR-03** | Passwords are stored using a strong KDF (bcrypt / argon2); plaintext credentials are never logged | Auth service policy & Hook: `password-hash-check.js` | Security unit tests + Log interceptor tests |
| **NFR-04** | Authentication enforced at controller layer; `ADMIN` and `CUSTOMER` endpoints are partitioned by role | Route guard middleware & Hook: `role-boundary-check.js` | Negative role boundary integration tests |
| **NFR-05** | Database migrations are append-only | Migration runner checks | CI migration sequence validation |
| **NFR-06** | Structured JSON logs with request correlation IDs | Express / Pino correlation middleware | Log output schema validation |
| **NFR-07** | Health endpoint returns HTTP 200 within 1 second of a successful startup | `/health` route reporting uptime and DB status | Healthcheck test during deployment verification |
| **NFR-08** | Architecture rules enforced as automated tests | `dependency-cruiser` + custom structural test suite | `npm run test:arch` executed on every build |

---

## 5. Domain Exception Hierarchy

All domain exceptions inherit from `DomainException` to ensure consistent HTTP status mapping:
```
DomainException (HTTP 400 default)
├── InsufficientFundsException (HTTP 400 - Insufficient cash balance)
├── InvalidOrderStateException (HTTP 409 - Illegal state transition)
├── WatchlistUpdateException (HTTP 422 - Watchlist validation / atomicity failure)
├── ResourceNotFoundException (HTTP 404 - Entity does not exist or soft-deleted)
├── RoleAccessDeniedException (HTTP 403 - Forbidden role access)
└── WatchlistLimitExceededException (HTTP 400 - Maximum 10 watchlists reached)
```

---

## 6. Major Feature Sub-Specifications

Detailed functional specifications are partitioned into feature specs:
- `specs/user-management_spec.md`: User onboarding, auth, role management, session tokens (AC-01, AC-02, NFR-03, NFR-04).
- `specs/stock-catalog_spec.md`: Symbol CRUD, soft-delete, search, market data stub with random-walk tick (AC-03).
- `specs/watchlist_spec.md`: Customer watchlist creation, atomicity, 10-watchlist cap (AC-04, AC-05).
- `specs/order_spec.md`: Market/limit orders, state machine, cash balance checks, append-only ledger (AC-06, AC-07, AC-08, NFR-01, NFR-02).
- `specs/portfolio_spec.md`: Customer holdings, average cost basis, total invested, current valuation, absolute and percentage P&L (AC-09, NFR-01).
- `specs/analytics_spec.md`: Top 5 gainers, top 5 losers, sector breakdown, platform trade volume statistics (AC-10).

---

## 7. Quality & Verification Gates
Autonomous builds must clear the 6-gate ratchet:
1. **Type & Compilation Gate**: Zero TypeScript or compilation errors.
2. **Lint & Style Gate**: Zero ESLint or code style infractions.
3. **Architecture Gate**: 100% adherence to `.dependency-cruiser.js` layering.
4. **Unit & Integration Test Gate**: All AC-tagged tests passing, 80% coverage hard floor, 100% target.
5. **Security Gate**: Zero plaintext password leaks, 100% role-boundary isolation.
6. **E2E Playwright Gate**: Complete customer and admin UI user flows verified headlessly.
