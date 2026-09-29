# Repositories Layer Guidelines (src/repositories/CLAUDE.md)

## 1. Responsibilities
- Abstract persistence logic behind clean repository interfaces.
- Execute SQL / query builder commands against SQLite.
- Maintain append-only ledgers and soft-deletion constraints.

## 2. Mandatory Invariants
- **Append-Only Trade Ledger (NFR-02)**:
  - Executed orders and trade records are append-only.
  - No `UPDATE` or `DELETE` statements may target executed order rows or trade history.
  - Attempting to mutate or delete executed trade records throws an error.
- **Soft-Delete for Stock Catalog (AC-03)**:
  - Symbols are never physically deleted (`DELETE FROM stocks`).
  - Delisting must execute an `UPDATE stocks SET status = 'DELISTED', delisted_at = ? WHERE symbol = ?`.
- **Append-Only Audit Logs (AC-02)**:
  - User role change audits are strictly inserted; never updated or removed.
- **Append-Only Migrations (NFR-05)**:
  - Schema changes must be managed through timestamped, forward-only migration scripts.
