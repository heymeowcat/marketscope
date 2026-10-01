# Evaluator Report — Sprint 2: Watchlist & Portfolio Valuation

**Date**: 2026-09-30T03:36:50Z  
**Sprint**: Sprint 2: Watchlist & Portfolio Valuation  
**Stories**: AC-04, AC-05, AC-09  
**VERDICT**: FAIL

---

## Executive Summary

Sprint 2 implementation fails due to critical TypeScript compilation errors that prevent code rebuild. While unit tests for watchlist creation, atomic updates, and portfolio statistics all pass (20 tests total), the application's API endpoints for these features are not accessible at runtime. The codebase has 18 compilation errors across multiple files including missing exception definitions and type violations in controllers. The application is running from a previous build artifact, but any code changes cannot be compiled or deployed.

---

## Infrastructure Health Check

**Status**: ✓ PASS (partial)  
**Health Check URL**: http://localhost:3000/api/health  
**Response**: 200 OK — `{"status":"ok"}`  
**Retry Attempts**: 1 (successful on first try)

**Issue**: Application is running but from stale compiled code. New builds fail immediately.

---

## TypeScript Compilation Status

**FAIL** — Build cannot complete.

### Compilation Errors

| Error | File | Line | Type |
|-------|------|------|------|
| Module '"./exceptions"' has no exported member 'HardDeleteNotAllowedException' | src/domain/stock-soft-delete-rule.ts | 1 | Missing Export |
| Module '"../domain/exceptions"' has no exported member 'HardDeleteNotAllowedException' | src/repositories/stock-repository.ts | 3 | Missing Export |
| Argument of type 'string \| undefined' not assignable to 'string' | src/controllers/portfolio-controller.ts | 48, 65, 93 | Type Error |
| Argument of type 'string \| undefined' not assignable to 'string' | src/controllers/user-admin-controller.ts | 94 | Type Error |
| Type '"CUSTOMER"' not assignable to 'UserRole' | tests/integration/watchlist-creation.spec.ts | 37, 164 | Enum Type Error |
| Type '"ACTIVATED"' not assignable to 'UserStatus' | tests/integration/watchlist-creation.spec.ts | 38, 165 | Enum Type Error |
| Type '"CUSTOMER"' not assignable to 'UserRole' | tests/integration/watchlist-atomic-update.spec.ts | 37, 180, 263 | Enum Type Error |
| Type '"ACTIVATED"' not assignable to 'UserStatus' | tests/integration/watchlist-atomic-update.spec.ts | 38, 181, 264 | Enum Type Error |

**Total Errors**: 18

---

## Layer 1 — API Contract Validation

**FAIL** — Endpoints not accessible.

### AC-04: Watchlist Creation

#### Test: POST /api/v1/watchlists (Create with valid symbols)
- **Expected Status**: 201 Created
- **Actual Status**: 404 Not Found
- **Response**: HTML error page — "Cannot POST /api/v1/watchlists"
- **Verdict**: FAIL

#### Test: POST /api/v1/watchlists (Create with empty symbols)
- **Expected Status**: 422 Unprocessable Entity
- **Actual Status**: 404 Not Found
- **Response**: HTML error page
- **Verdict**: FAIL

#### Test: GET /api/v1/watchlists (List customer watchlists)
- **Expected Status**: 200 OK
- **Actual Status**: 404 Not Found
- **Response**: HTML error page
- **Verdict**: FAIL

#### Test: 10-Watchlist Limit Enforcement
- **Expected**: Create 1-10 succeed (201), 11th fails (400)
- **Actual**: All requests return 404
- **Verdict**: FAIL

### AC-05: Atomic Watchlist Updates

#### Test: PUT /api/v1/watchlists/:id (Update name and symbols)
- **Expected Status**: 200 OK
- **Actual Status**: 404 Not Found
- **Response**: HTML error page
- **Verdict**: FAIL

#### Test: PUT with invalid symbol (rollback)
- **Expected Status**: 422 Unprocessable Entity
- **Actual Status**: 404 Not Found
- **Verdict**: FAIL

#### Test: DELETE /api/v1/watchlists/:id
- **Expected Status**: 204 No Content
- **Actual Status**: 404 Not Found
- **Verdict**: FAIL

### AC-09: Portfolio Statistics

#### Test: GET /api/v1/portfolio/stats
- **Expected Status**: 200 OK with stats object
- **Actual Status**: 404 Not Found
- **Response**: HTML error page — "Cannot GET /api/v1/portfolio/stats"
- **Verdict**: FAIL

#### Test: GET /api/v1/portfolio/holdings
- **Expected Status**: 200 OK
- **Actual Status**: 404 Not Found
- **Verdict**: FAIL

#### Test: GET /api/v1/portfolio/summary
- **Expected Status**: 200 OK
- **Actual Status**: 404 Not Found
- **Verdict**: FAIL

---

## Layer 2 — Playwright E2E Validation

**SKIP** — Endpoints not accessible; Layer 1 failures preclude browser testing.

The watchlist and portfolio pages cannot be tested because the API endpoints that feed them are returning 404 errors.

---

## Layer 3 — Design Checks

**SKIP** — Blocked by Layer 1 failures. UI cannot be tested without functional API.

---

## Unit Test Suite Status

**Overall**: 191 PASSED, 24 FAILED (unrelated to Sprint 2)

### Sprint 2 Tests (All Passing)

| Test File | Tests | Status |
|-----------|-------|--------|
| tests/integration/watchlist-creation.spec.ts | 4 | ✓ PASS |
| tests/integration/watchlist-atomic-update.spec.ts | 6 | ✓ PASS |
| tests/integration/portfolio-statistics.spec.ts | 10 | ✓ PASS |
| tests/unit/domain/watchlist-limit-rule.spec.ts | 4 | ✓ PASS |
| tests/unit/domain/portfolio-pnl-policy.spec.ts | 19 | ✓ PASS |
| tests/unit/domain/pnl-precision-edge-cases.spec.ts | 14 | ✓ PASS |
| tests/unit/services/watchlist-service.spec.ts | 11 | ✓ PASS |

**Sprint 2 Unit Test Total**: 68/68 PASSED

### Failing Tests (Sprint 1 / AC-03 stock-catalog, not part of Sprint 2)

| Test File | Failed Count | Reason |
|-----------|--------------|--------|
| tests/integration/stock-catalog-admin.spec.ts | 11 | Stock admin endpoints return 404 |
| tests/integration/stock-search.spec.ts | 13 | Stock search endpoints return 404 |

**Note**: Stock-related test failures (24 tests) are not part of Sprint 2 scope. These appear related to missing HardDeleteNotAllowedException export.

---

## Architecture Validation

**Status**: Cannot verify in current state.

### Dependency Cruiser (test:arch)

Cannot run `npm run test:arch` due to TypeScript compilation failure. Architecture rules cannot be validated until build succeeds.

### Expected Checks (from contract)

- Fixed-point math (NFR-01): Should be verified via Decimal.js usage in portfolio-pnl-policy.ts
- Atomic transactions: Should be verified via watchlist service transaction handling
- 4-tier layering: Cannot verify without successful build

---

## Root Cause Analysis

### Primary Issue: Missing HardDeleteNotAllowedException Export

**Files Affected**:
- src/domain/exceptions.ts — Does not define or export HardDeleteNotAllowedException
- src/domain/stock-soft-delete-rule.ts — Imports HardDeleteNotAllowedException (line 1)
- src/repositories/stock-repository.ts — Imports HardDeleteNotAllowedException (line 3)

**Impact**: Compilation fails before any code can be executed or tested.

### Secondary Issue: Type Violations in Controllers

**Files Affected**:
- src/controllers/portfolio-controller.ts — Passes `string | undefined` to functions expecting `string` (lines 48, 65, 93)
- src/controllers/user-admin-controller.ts — Same issue (line 94)

**Root Cause**: User ID extraction from JWT payload returns union type; needs null coalescing or safe access.

### Tertiary Issue: Enum Usage in Tests

**Files Affected**:
- tests/integration/watchlist-creation.spec.ts — Uses string literals `"CUSTOMER"` instead of `UserRole.CUSTOMER`
- tests/integration/watchlist-atomic-update.spec.ts — Same issue

**Root Cause**: Tests use string enum values instead of enum members, which TypeScript strict mode rejects.

---

## Remediation Required

### Immediate Actions (Blocking)

1. **Add HardDeleteNotAllowedException to exceptions.ts**
   - Define exception class following existing pattern
   - Export it with proper prototype chain setup

2. **Fix portfolio-controller.ts type errors**
   - Use nullish coalescing: `req.user?.user_id ?? req.user?.userId`
   - Or assert non-null with `req.user!.user_id || req.user!.userId`

3. **Fix user-admin-controller.ts type errors**
   - Apply same fix as portfolio-controller.ts

4. **Fix test enum usage**
   - Replace `role: "CUSTOMER"` with `role: UserRole.CUSTOMER`
   - Replace `status: "ACTIVATED"` with `status: UserStatus.ACTIVE`

### Verification Steps After Fix

1. Run `npm run build` and confirm 0 errors
2. Start app: `npm start`
3. Verify health check: `curl http://localhost:3000/api/health`
4. Test watchlist creation: `curl -X POST http://localhost:3000/api/v1/watchlists` with auth
5. Test portfolio stats: `curl -X GET http://localhost:3000/api/v1/portfolio/stats` with auth
6. Run full test suite: `npm run test`
7. Run architecture check: `npm run test:arch`

---

## Sprint 2 Readiness Assessment

| Component | Status | Notes |
|-----------|--------|-------|
| Unit Tests | ✓ PASS | 68/68 Sprint 2 tests passing |
| Integration Tests | ✓ PASS | watchlist-creation, watchlist-atomic-update, portfolio-statistics all passing |
| API Contracts | ✗ FAIL | Endpoints not accessible due to 404 |
| Architecture | ? UNKNOWN | Cannot verify without successful build |
| Fixed-Point Math | ✓ DESIGNED | Decimal.js rules present; not testable at runtime |
| E2E UI | ✗ SKIPPED | Blocked by API failures |

---

## Features.json Update

```json
{
  "watchlist": {
    "passes": false,
    "last_evaluated": "2026-09-30T03:36:50Z",
    "failure_reason": "API endpoints return 404; TypeScript compilation errors prevent rebuild",
    "failure_layer": "api"
  },
  "portfolio": {
    "passes": false,
    "last_evaluated": "2026-09-30T03:36:50Z",
    "failure_reason": "API endpoints return 404; TypeScript compilation errors prevent rebuild",
    "failure_layer": "api"
  }
}
```

---

## Conclusion

**VERDICT: FAIL**

Sprint 2 implementation has a critical infrastructure failure. While the business logic is correctly implemented (as evidenced by 68 passing unit and integration tests), the code cannot be compiled due to missing exception exports and type errors. The API endpoints are inaccessible at runtime, returning 404 errors for all watchlist and portfolio routes.

**Blocking Issues**:
1. HardDeleteNotAllowedException undefined (compilation)
2. Type mismatches in controllers (compilation)
3. Enum usage errors in tests (compilation)

**Recommendation**: Return to Generator with specific compilation errors for remediation. Once build succeeds, re-run evaluation to verify API and E2E layers.

**Next Steps**: Fix the 18 compilation errors, rebuild, and re-evaluate against sprint contract.
