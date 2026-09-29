# Services Layer Guidelines (src/services/CLAUDE.md)

## 1. Responsibilities
- Orchestrate business workflows across multiple domain entities and repositories.
- Manage transactional boundaries (e.g. database transactions for atomic operations).
- Coordinate external stubs (market price feed, notification stubs).
- Audit sensitive administrative actions (e.g. user role changes per AC-02).

## 2. Invariants & Rules
- **Atomic Watchlist Updates (AC-05)**:
  - All watchlist modifications (rename, add/remove symbols) must be wrapped inside a database transaction.
  - If any symbol in the batch fails validation or does not exist, the service must roll back the transaction and throw `WatchlistUpdateException`.
- **Order Placement Orchestration (AC-06, AC-08)**:
  - Verify customer cash balance using `InsufficientFundsRule` before persisting order in `PENDING` state.
  - Atomically reserve cash hold upon BUY order acceptance.
- **Audit Logging (AC-02)**:
  - Any role update performed by an administrator must persist an immutable audit record containing actor ID, target ID, old role, new role, timestamp, and optional reason.
