# Specification Layer Guidelines (specs/CLAUDE.md)

## 1. Specification Principles
- **Specification Is Truth**: Every capability in MarketScope is governed by a markdown spec in `specs/`. When code and spec diverge, update the specification first.
- **Traceability**: Every feature spec must explicitly map to its corresponding Acceptance Criteria (AC-01 through AC-10) and Non-Functional Requirements (NFR-01 through NFR-08).
- **Testable Form**: All acceptance criteria must be expressed with Given-When-Then scenarios and clear failure modes.

## 2. Directory Structure
- `specs/app_spec.md`: Root specification containing system invariants, exception hierarchy, and high-level architecture.
- `specs/user-management_spec.md`: Customer registration, admin role management, and audit logs (AC-01, AC-02, NFR-03, NFR-04).
- `specs/stock-catalog_spec.md`: Stock symbol CRUD, soft-delete via DELISTED, and search (AC-03).
- `specs/watchlist_spec.md`: Customer watchlists, 10-list cap, and atomic batch modifications (AC-04, AC-05).
- `specs/order_spec.md`: Order placement, lifecycle state machine, and cash sufficiency checks (AC-06, AC-07, AC-08, NFR-01, NFR-02).
- `specs/portfolio_spec.md`: Cost basis, valuation, and fixed-point P&L math (AC-09, NFR-01).
- `specs/analytics_spec.md`: Top 5 gainers/losers, sector exposure, and platform stats (AC-10).

## 3. Review Rules for Agents
- When generating code, read the relevant `specs/<feature>_spec.md` before generating or modifying any file.
- Do not add features or endpoints not declared in the specification.
- Every test must be annotated with its AC tag, e.g. `// [AC-08] Insufficient funds test`.
