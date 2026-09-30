# Learned Rules
<!-- Monotonic — rules are NEVER deleted. Only add new rules. -->
<!-- Format: Each rule includes Impact, Pattern, Mistake description, Anti-Pattern code, Better Approach code, Rule, and Applied-in fields. See .claude/skills/auto/SKILL.md SECTION 12 for full format. -->

## LR-001: Async Promise Rejection Testing Pattern in Vitest
- **Impact**: High (prevents unhandled promise rejections and false test passes)
- **Pattern**: Asynchronous unit & integration testing
- **Mistake**: Wrapping asynchronous service calls inside synchronous `expect(async () => await fn()).toThrow()`. In Vitest/Jest, async arrow functions return rejected promises that `.toThrow()` does not catch.
- **Anti-Pattern**:
  ```ts
  // WRONG: Does not catch rejection properly
  expect(async () => await service.placeOrder(input)).toThrow(InsufficientFundsException);
  ```
- **Better Approach**:
  ```ts
  // CORRECT:
  await expect(service.placeOrder(input)).rejects.toThrow(InsufficientFundsException);
  ```
- **Rule**: For all asynchronous functions under test, ALWAYS use `await expect(promise).rejects.toThrow(ExpectedException)`. NEVER wrap in `expect(async () => ...)`.
- **Applied-in**: `tests/unit/services/*.spec.ts`, `tests/integration/*.spec.ts`

---

## LR-002: Express Router Route Path Relative Mounting
- **Impact**: High (prevents 404 route nesting bugs like `/api/v1/stocks/stocks`)
- **Pattern**: Controller route definitions and Express mounting in `app.ts`
- **Mistake**: Defining routes inside controllers with the resource name (e.g. `this.router.get('/stocks', ...)`), when `app.ts` already mounts the router at `app.use('/api/v1/stocks', controller.getRouter())`.
- **Anti-Pattern**:
  ```ts
  // Inside StockCatalogController:
  this.router.get('/stocks', this.searchStocks.bind(this));
  // Mounted in app.ts: app.use('/api/v1/stocks', controller.getRouter());
  // Resulting endpoint: /api/v1/stocks/stocks (404 for /api/v1/stocks)
  ```
- **Better Approach**:
  ```ts
  // Inside StockCatalogController:
  this.router.get('/', this.searchStocks.bind(this));
  this.router.get('/:symbol', this.getStock.bind(this));
  ```
- **Rule**: All route paths declared in `setupRoutes()` MUST be relative to the controller's mount point (`/` and `/:id`). Never repeat the resource prefix.
- **Applied-in**: `src/controllers/*-controller.ts`

---

## LR-003: Strict Null Checking on Authenticated User Context
- **Impact**: Medium (prevents TypeScript compilation failures under strictNullChecks)
- **Pattern**: Controller authentication parameter extraction
- **Mistake**: Directly passing `req.user?.userId` to service methods expecting a `string` without validating whether `req.user` is defined.
- **Anti-Pattern**:
  ```ts
  // WRONG: Argument of type 'string | undefined' is not assignable to parameter of type 'string'
  await this.service.doAction(req.user?.userId);
  ```
- **Better Approach**:
  ```ts
  // CORRECT:
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing user context' } });
    return;
  }
  await this.service.doAction(userId);
  ```
- **Rule**: Extract and guard authenticated user IDs with an early 401 response before calling service methods.
- **Applied-in**: `src/controllers/*-controller.ts`

---

## LR-004: Canonical Domain Entity Seeding Schema in Integration Tests
- **Impact**: High (prevents repository schema mismatches and runtime runtime errors)
- **Pattern**: Test data fixtures and database seeding in integration tests
- **Mistake**: Generating test user objects with ad-hoc field names (`user_id`, `userId`, `hashed_password`, `role: 'CUSTOMER'`, `status: 'ACTIVATED'`).
- **Anti-Pattern**:
  ```ts
  // WRONG: Inconsistent schema
  await userRepository.create({
    user_id: 'cust-1',
    hashed_password: 'pwd',
    role: 'CUSTOMER',
    status: 'ACTIVATED'
  });
  ```
- **Better Approach**:
  ```ts
  // CORRECT: Adheres to UserEntity and domain enums
  await userRepository.create({
    id: 'cust-1',
    email: 'customer@example.com',
    passwordHash: 'hashed_pw',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    cashBalance: new Decimal('50000'),
    createdAt: new Date(),
    updatedAt: new Date()
  });
  ```
- **Rule**: Always import and use domain enums (`UserRole`, `UserStatus`, `StockStatus`, `OrderSide`, `OrderStatus`) and canonical entity property names when seeding test entities.
- **Applied-in**: `tests/integration/*.spec.ts`, `tests/unit/*.spec.ts`

---

## LR-005: Playwright E2E Build Pre-Condition and Health Check Route Alignment
- **Impact**: Critical (prevents CI pipeline failures and 120s webServer timeouts)
- **Pattern**: Playwright E2E test execution and webServer lifecycle
- **Mistake**: Running `playwright test` with `webServer.command = 'npm start'` without compiling TypeScript to `dist/`, and mismatching the polling URL between `playwright.config.ts` (`/health`) and `app.ts` (`/api/health`).
- **Anti-Pattern**:
  - `playwright.config.ts` polls `/health`, but app only defines `/api/health` → 120s timeout.
  - CI runs `test:e2e` without `npm run build` → Node crashes with `MODULE_NOT_FOUND` on missing `dist/` files.
- **Better Approach**:
  - Configure `"pretest:e2e": "npm run build"` in `package.json` and explicit `npm run build` in CI.
  - Mount health handler on both `/health` and `/api/health` with `{ status: 'ok', uptime: process.uptime() }`.
  - Exclude `tests/e2e/**` from Vitest test runner config.
- **Rule**: Playwright tests must reside in `tests/e2e/`, be excluded from Vitest, have an automated pre-test build, and check an aligned `/health` endpoint.
- **Applied-in**: `playwright.config.ts`, `package.json`, `.github/workflows/ci.yml`, `vitest.config.ts`, `src/app.ts`
