# Test Suite Guidelines (tests/CLAUDE.md)

## 1. Testing Philosophy & TDD Discipline
- MarketScope mandates strict Test-Driven Development (TDD): Red -> Green -> Refactor.
- Write failing unit tests based on acceptance criteria before generating implementation code.
- Floor coverage: 80% minimum required for all services and domain modules; 100% target.

## 2. Directory Layout & Test Classification
- `tests/unit/`: Pure domain rule tests, mathematical precision edge cases, and isolated service tests.
- `tests/integration/`: Express API endpoint tests checking HTTP status codes, headers, and database transactions.
- `tests/architecture/`: Structural integrity tests using `dependency-cruiser` and custom assertions (layering rules, role boundary checks, executed order immutability).
- `tests/e2e/`: End-to-end browser automation tests using Playwright validating user journeys and snapshots.

## 3. Mandatory Acceptance Criteria Tagging
Every test verifying a business requirement MUST be explicitly tagged with its AC identifier:
- `// [AC-01] User Registration & Activation`
- `// [AC-02] Admin Role Update & Audit Log`
- `// [AC-03] Stock Catalog CRUD & Soft-Delete`
- `// [AC-04] Watchlist Creation & 10-List Cap`
- `// [AC-05] Watchlist Atomic Update & Exception`
- `// [AC-06] Order Placement & Server-Side Timestamp`
- `// [AC-07] Order Lifecycle State Machine`
- `// [AC-08] Insufficient Funds Guard`
- `// [AC-09] Portfolio Valuation & P&L Math`
- `// [AC-10] Top 5 Gainers & Losers Ranking`

## 4. Mandatory Assertion & Async Patterns (Vitest vs Playwright)
- **Async Promise Rejections (CRITICAL)**:
  - When asserting that an asynchronous function or service throws, ALWAYS use `rejects.toThrow`:
    ```ts
    // CORRECT:
    await expect(service.method(args)).rejects.toThrow(SpecificException);

    // FORBIDDEN (will cause false pass or unhandled rejection):
    expect(async () => await service.method(args)).toThrow(SpecificException);
    ```
- **Test Runner Separation**:
  - `vitest` runs `tests/unit/`, `tests/integration/`, `tests/architecture/`, `tests/security/`.
  - `playwright` runs `tests/e2e/`.
  - NEVER import `@playwright/test` in unit, integration, or architecture tests.
  - NEVER import `vitest` in `tests/e2e/`.

## 5. Test Data Seeding & Entity Contracts
When seeding repositories in integration tests, ALWAYS conform to canonical domain entity schemas:
- **User Entity**:
  ```ts
  await userRepository.create({
    id: 'customer-123',             // NEVER userId or user_id
    email: 'customer@example.com',
    passwordHash: 'hashed_password', // NEVER hashed_password
    role: UserRole.CUSTOMER,         // Use UserRole enum, NEVER raw strings
    status: UserStatus.ACTIVE,       // Use UserStatus enum (ACTIVE, INACTIVE), NEVER 'ACTIVATED'
    cashBalance: new Decimal('50000'), // ALWAYS Decimal.js instance
    createdAt: new Date(),
    updatedAt: new Date()
  });
  ```
- **Stock Entity**:
  - `status: StockStatus.ACTIVE` | `StockStatus.DELISTED` (use enum)
  - `currentPrice: new Decimal('...')`

## 6. Execution Commands
```bash
npm run test           # Run all unit and integration tests (Vitest)
npm run test:coverage  # Generate lcov.info / coverage report
npm run test:arch      # Run architectural boundaries check (dependency-cruiser)
npm run test:e2e       # Run Playwright E2E UI validation (auto-runs build first)
npm run verify         # Full CI verification gate
```
