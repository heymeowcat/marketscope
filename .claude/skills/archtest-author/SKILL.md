# Architecture Test Author Skill

## Purpose
Authors and maintains automated structural tests (using `dependency-cruiser` and custom test assertions) that enforce 4-tier layering, role boundaries, and immutability rules (NFR-08).

## Architectural Invariants to Verify

### 1. Layering Boundaries
- Controllers may depend only on Services and DTOs.
- Services may depend on Domain entities, Domain rules, and Repositories.
- Domain entities and rules must NEVER depend on Controllers, Services, or Repositories.
- Repositories must NEVER depend on Controllers or Services.
- Controllers must NEVER import Repositories or directly query the database.

### 2. Role Boundary Protection (NFR-04, NFR-08)
- Every route handler under `/api/v1/admin/*` must have an explicit role guard restricting access to `ADMIN`.
- A structural test scans all exported Express routes to verify middleware chain includes `requireRole('ADMIN')`.

### 3. Executed Order Immutability (NFR-02, NFR-08)
- Scans repository implementation to ensure no `UPDATE` or `DELETE` SQL queries exist for executed orders or trade history.
