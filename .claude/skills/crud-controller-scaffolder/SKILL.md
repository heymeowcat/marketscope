# CRUD Controller Scaffolder Skill

## Purpose
Scaffolds enterprise-grade 4-tier modules (Controller, Service, Domain Entity, Repository) strictly complying with MarketScope architectural invariants, role-based access control, and AC-tagged testing conventions.

## Workflow

### 1. Specification Inspection
- Locate and read the target specification in `specs/<feature>_spec.md`.
- Extract all Acceptance Criteria (AC-NN) and Non-Functional Requirements (NFR-NN).
- Identify role restrictions: Public, `CUSTOMER`, or `ADMIN`.

### 2. Scaffold Domain Layer (`src/domain/`)
- Define TypeScript entity interfaces and value objects.
- Implement invariant validation functions and custom `DomainException` subclasses.
- Ensure ZERO external dependencies (only `decimal.js` if doing financial calculations).

### 3. Scaffold Repository Layer (`src/repositories/`)
- Define repository interface.
- Implement persistence queries with append-only checks for trade ledgers or soft-delete flags (`status = 'DELISTED'`) for stock symbols.
- Never hard-delete records.

### 4. Scaffold Service Layer (`src/services/`)
- Orchestrate business transactions.
- Wrap atomic operations (e.g. watchlist symbol modifications) in explicit transactional rollback blocks.
- Throw typed domain exceptions on rule violations.

### 5. Scaffold Controller Layer (`src/controllers/`)
- Define Express router.
- Apply authentication middleware (`authenticateToken`).
- Apply role guards (`requireRole('ADMIN')` or `requireRole('CUSTOMER')`).
- Map service outputs and domain exceptions to standardized JSON error envelopes with correlation IDs.

### 6. Scaffold Test Suite (`tests/`)
- Write unit tests in `tests/unit/` for domain invariants.
- Write integration tests in `tests/integration/` with explicit `// [AC-NN]` annotations.
- Verify 100% route coverage and role boundary isolation.
