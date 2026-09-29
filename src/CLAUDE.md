# Application Source Layer Guidelines (src/CLAUDE.md)

## 1. 4-Tier Layered Architecture
Source code in `src/` must adhere to strict 4-tier separation:
1. `src/controllers/`: HTTP presentation, parameter parsing, authentication extraction, and status code mapping.
2. `src/services/`: Business workflow orchestration, transactional atomicity, and event dispatching.
3. `src/domain/`: Pure business rules, entity models, invariant checks, and custom domain exceptions.
4. `src/repositories/`: Persistence abstraction, SQL/ORM queries, append-only ledger enforcement.

## 2. Invariant Rules
- **No Controller-to-Repository Access**: Controllers must never import or call repositories directly. All access flows through services.
- **No Reverse Dependencies**: Domain code must NEVER import from services, controllers, or repositories. Domain is pure TypeScript.
- **Fixed-Point Financial Math (NFR-01)**: All price, quantity, and P&L math must use `Decimal` from `decimal.js`. Primitive JavaScript math (`+`, `-`, `*`, `/`) is forbidden on money amounts.
- **Append-Only Auditing (NFR-02)**: Executed orders, trade executions, and admin role change audit records are immutable.
- **Soft-Delete Only (AC-03)**: Stock symbols cannot be physically deleted from the catalog.

## 3. Error Handling
- Services and domain raise specific subclasses of `DomainException`.
- Global error middleware maps exceptions to standardized HTTP JSON responses:
  - `InsufficientFundsException` -> HTTP 400
  - `InvalidOrderStateException` -> HTTP 409
  - `WatchlistUpdateException` -> HTTP 422
  - `ResourceNotFoundException` -> HTTP 404
  - `RoleAccessDeniedException` -> HTTP 403
