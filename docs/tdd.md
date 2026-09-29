# Test-Driven Development (TDD) Discipline Document
## MarketScope Engineering Standards (docs/tdd.md)

---

## 1. The Red-Green-Refactor Lifecycle

Every agent generating code in MarketScope strictly executes the Red-Green-Refactor discipline:

```
    +-----------------------------------------------+
    |                     RED                       |
    |  Author failing test based on specification   |
    |  Acceptance Criteria (AC-NN)                  |
    +-----------------------+-----------------------+
                            |
                            v
    +-----------------------------------------------+
    |                    GREEN                      |
    |  Generate minimal production code required    |
    |  to pass the test assertions                  |
    +-----------------------+-----------------------+
                            |
                            v
    +-----------------------------------------------+
    |                   REFACTOR                    |
    |  Clean up design, enforce immutability,       |
    |  verify architectural layering rules          |
    +-----------------------------------------------+
```

---

## 2. Worked Example: AC-08 Insufficient Funds Path

### Step 1: RED (Failing Test)
The `order-lifecycle-agent` reads `specs/order_spec.md` (AC-08) and authors the failing unit test before any implementation exists:

```typescript
// tests/unit/domain/InsufficientFundsRule.spec.ts
import { describe, it, expect } from 'vitest';
import { InsufficientFundsRule, InsufficientFundsException } from '../../../src/domain/InsufficientFundsRule';
import { Decimal } from 'decimal.js';

describe('InsufficientFundsRule [AC-08]', () => {
  it('should throw InsufficientFundsException when quote_price * quantity exceeds available cash', () => {
    const availableCash = '1000.00';
    const quotePrice = '180.00';
    const quantity = 10; // Total required: 1800.00 > 1000.00

    expect(() => {
      InsufficientFundsRule.validateBuyFunds(availableCash, quotePrice, quantity);
    }).toThrowError(InsufficientFundsException);
  });

  it('should return required and remaining cash when balance is sufficient', () => {
    const availableCash = '5000.00';
    const quotePrice = '180.00';
    const quantity = 10;

    const result = InsufficientFundsRule.validateBuyFunds(availableCash, quotePrice, quantity);
    expect(result.requiredCash.toFixed(2)).toBe('1800.00');
    expect(result.remainingCash.toFixed(2)).toBe('3200.00');
  });
});
```
*Test execution status*: **FAILED** (`Cannot find module InsufficientFundsRule`).

---

### Step 2: GREEN (Minimal Implementation)
The `generator` agent creates the minimal implementation in `src/domain/InsufficientFundsRule.ts`:

```typescript
import { Decimal } from 'decimal.js';

export class InsufficientFundsException extends Error {
  constructor(public required: Decimal, public available: Decimal) {
    super(`Required cash $${required.toFixed(2)} exceeds available balance $${available.toFixed(2)}`);
  }
}

export class InsufficientFundsRule {
  public static validateBuyFunds(availableCash: string, quotePrice: string, quantity: number) {
    const cash = new Decimal(availableCash);
    const required = new Decimal(quotePrice).times(new Decimal(quantity));
    if (required.greaterThan(cash)) {
      throw new InsufficientFundsException(required, cash);
    }
    return { requiredCash: required, remainingCash: cash.minus(required) };
  }
}
```
*Test execution status*: **PASSED** (2 tests passing).

---

### Step 3: REFACTOR (Architectural Polish & Invariants)
Refactor the implementation to inherit from `DomainException`, add HTTP status code 400 mapping, add input validation for strictly positive price and quantity, and verify adherence to NFR-01 (fixed-point rounding).

---

## 3. Required Test File Matrix for MarketScope

The test suite must comprise at least 10 dedicated test suites mapping to each acceptance criteria:
1. `tests/unit/AuthService.spec.ts` (`[AC-01]`)
2. `tests/integration/UserRoleAudit.spec.ts` (`[AC-02]`)
3. `tests/unit/StockSoftDeleteRule.spec.ts` (`[AC-03]`)
4. `tests/unit/WatchlistLimitRule.spec.ts` (`[AC-04]`)
5. `tests/integration/WatchlistAtomicUpdate.spec.ts` (`[AC-05]`)
6. `tests/integration/OrderPlacement.spec.ts` (`[AC-06]`)
7. `tests/unit/OrderLifecycleStateMachine.spec.ts` (`[AC-07]`)
8. `tests/unit/InsufficientFundsRule.spec.ts` (`[AC-08]`)
9. `tests/unit/PortfolioPnLPolicy.spec.ts` (`[AC-09]`, `[NFR-01]`)
10. `tests/unit/StatsAggregatorRule.spec.ts` (`[AC-10]`)
11. `tests/architecture/layering.spec.ts` (`[NFR-08]`)
12. `tests/security/RoleBoundary.spec.ts` (`[NFR-04]`)
