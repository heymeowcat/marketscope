# MarketScope: Stock Trading & Portfolio Analytics Platform
## Business Case Document (docs/business-case.md)
**Project Reference:** BC-AINE-006  
**Domain:** FinTech — Capital Markets / Retail Brokerage  
**Document Target:** Automated Evaluator & Human Architecture Review  

---

## 1. Problem Statement & Context
Retail equity investors face high friction when navigating fragmented platforms that lack clear separation between execution, watchlist curation, and portfolio analytics. Existing brokerage tools frequently suffer from:
1. **Opaque Order States & Invariants**: Vague order lifecycle management where order cancellation or modification after execution results in ledger inconsistencies and compliance violations.
2. **Financial Precision Drift**: Unsound floating-point arithmetic leading to penny-rounding errors in cash balances, cost basis, and portfolio P&L calculations.
3. **Weak Operational Guardrails**: Permissive data models that permit physical record deletion, destroying the append-only regulatory audit trail required in capital markets.
4. **Scattered Portfolio Analytics**: Inability for self-serve retail customers to quickly discern their top-performing and underperforming assets, sector concentrations, and unrealized gains across diverse market conditions.

MarketScope addresses these challenges by delivering a self-serve stock trading and portfolio analytics engine engineered with zero-compromise architectural discipline, deterministic fixed-point calculations, and strict role-based operational boundaries.

---

## 2. Target Users & Personas

### 2.1 Retail Customer (Investor / Trader)
- **Profile**: Active individual investors seeking a self-serve platform to research equities, track curated baskets of symbols, place BUY/SELL orders with real-time purchasing power checks, and analyze portfolio gains.
- **Key Needs**:
  - Seamless self-registration with immediate activation and initial simulated cash allotment.
  - Organization of equities into tailored watchlists (capped at 10 lists for focused monitoring).
  - Reliable market and limit order execution with predictable status transitions (`PENDING`, `EXECUTED`, `CANCELLED`, `REJECTED`).
  - Real-time visibility into cost basis, portfolio valuation, absolute and percentage P&L, and top 5 gainers/losers.

### 2.2 Brokerage Operations & Platform Administrator
- **Profile**: Internal compliance and operations personnel responsible for market integrity, catalog curation, and account lifecycle management.
- **Key Needs**:
  - Full catalog CRUD capabilities with strict soft-deletion (`DELISTED`) to preserve historical trade provenance.
  - User role assignment (`CUSTOMER`, `ADMIN`, `SUSPENDED`) with comprehensive timestamped audit logs.
  - Surveillance of platform-wide order flow, settlement queues, and ticker volumes.

---

## 3. Value Proposition
- **High-Integrity Execution**: Guaranteed cash-sufficiency checks prior to order acceptance, preventing overdrafts or negative cash balances.
- **Deterministic Financial Mathematics**: Fixed-point decimal arithmetic across all financial calculations guarantees zero IEEE 754 precision drift.
- **Compliance-First Auditing**: Immutability of executed trades and user role transitions ensures complete regulatory auditability.
- **Real-Time Portfolio Intelligence**: Instantaneous calculation of weighted cost basis, unrealized P&L, and ranked daily performance.

---

## 4. Key Performance & Success Metrics

| Dimension | Metric | Target |
|---|---|---|
| **Financial Accuracy** | Rounding error across P&L and cash ledger | Exactly 0.00% (fixed-point Decimal) |
| **System Availability** | Health endpoint response latency | < 1,000 ms from cold startup |
| **Order Safety** | Illegal state transitions allowed | Exactly 0 (enforced via state machine) |
| **Data Integrity** | Physical deletion of stock symbols or trades | Exactly 0 (append-only / soft-delete) |
| **Authorization Rigor**| Customer access to administrative endpoints | 0% success (100% blocked with HTTP 403) |
| **Test Quality** | Code coverage across domain rules and services | >= 80% hard floor, 100% target |

---

## 5. Domain Rules & Core Invariants

### 5.1 User Lifecycle & Role Boundaries
- **Rule DR-01 (Account Creation)**: New user registrations default to `ACTIVE` status with role `CUSTOMER`.
- **Rule DR-02 (Audited Role Changes)**: Only `ADMIN` can alter user roles (`CUSTOMER`, `ADMIN`, `SUSPENDED`). Every change logs actor ID, target ID, previous role, new role, and UTC timestamp.
- **Rule DR-03 (Suspension Lockdown)**: Users in `SUSPENDED` state cannot place orders, edit watchlists, or login.

### 5.2 Stock Catalog Administration
- **Rule DR-04 (Immutability of History)**: Stock symbols can never be physically deleted (`DELETE FROM`). Delisting sets `status = DELISTED` and stamps `delisted_at`. Delisted stocks are excluded from active customer browsing but retained for trade reconciliation.

### 5.3 Watchlist Constraints & Atomicity
- **Rule DR-05 (Watchlist Cap)**: Maximum of 10 watchlists per customer.
- **Rule DR-06 (Creation Constraint)**: Watchlists must contain a valid name and at least 1 symbol upon creation.
- **Rule DR-07 (Atomic Updates)**: Batch symbol additions/removals execute in a single atomic transaction. If any symbol is invalid or delisted, the transaction rolls back and raises `WatchlistUpdateException`.

### 5.4 Order Placement & Execution
- **Rule DR-08 (Cash Sufficiency Guard)**: A `BUY` order requires:
  $$\text{available\_cash} \ge \text{quote\_price} \times \text{quantity}$$
  Breaching this check immediately raises `InsufficientFundsException`.
- **Rule DR-09 (Lifecycle State Transitions)**: Orders enter `PENDING` with server-side UTC timestamps. Terminal states are `EXECUTED`, `CANCELLED`, or `REJECTED`. Moving an `EXECUTED` order to any other state raises `InvalidOrderStateException`.
- **Rule DR-10 (Trade Immutability)**: Trade execution records are strictly append-only.

### 5.5 Portfolio Analytics & Math
- **Rule DR-11 (Portfolio P&L Calculation)**:
  $$\text{total\_invested} = \sum (Q_i \times \bar{P}_{\text{buy}, i})$$
  $$\text{current\_value} = \sum (Q_i \times P_{\text{market}, i})$$
  $$\text{absolute\_pnl} = \text{current\_value} - \text{total\_invested}$$
  $$\text{percent\_pnl} = (\text{absolute\_pnl} / \text{total\_invested}) \times 100$$
- **Rule DR-12 (Top Gainers and Losers)**: Evaluated strictly over current customer holdings ($Q_i > 0$). Top 5 gainers ($\Delta\% \ge 0$) and top 5 losers ($\Delta\% < 0$ in order of largest loss).
