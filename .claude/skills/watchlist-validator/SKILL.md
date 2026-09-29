# Watchlist Validator Skill

## Purpose
Validates and enforces domain invariants for customer watchlists: capping lists to a maximum of 10 per user, requiring at least one initial symbol, and guaranteeing transactional atomicity on batch mutations (AC-04, AC-05).

## Rules & Invariants

### 1. 10-Watchlist Limit (AC-04)
- Query customer's active watchlists before creating a new one:
  ```typescript
  if (currentCount >= 10) {
    throw new WatchlistLimitExceededException();
  }
  ```
- Reject attempt with HTTP 400 Bad Request.

### 2. Creation Payload Validation (AC-04)
- Must supply a non-empty `name` string.
- Must provide `symbols` array containing at least 1 valid stock ticker.
- Empty or whitespace names return HTTP 400; empty symbol array returns HTTP 422.

### 3. Transactional Atomicity (AC-05)
- All rename and symbol modification operations must execute inside a single database transaction.
- Before committing:
  1. Validate all requested symbols exist in active stock catalog (`status = 'ACTIVE'`).
  2. If any symbol is invalid or delisted, abort the entire transaction.
  3. Throw `WatchlistUpdateException` returning HTTP 422.
  4. Ensure zero partial updates are written to the database.
