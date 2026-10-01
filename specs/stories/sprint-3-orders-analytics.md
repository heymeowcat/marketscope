# Sprint 3: Order Lifecycle & Daily Analytics

## Stories

### Story S07 — Order Placement & Cash Sufficiency Guard (AC-06, AC-08, NFR-01, NFR-02)
**Layer:** api  
**Owner:** order-lifecycle-agent  
**Files:** `src/controllers/order-controller.ts`, `src/services/order-service.ts`, `src/repositories/order-repository.ts`, `src/domain/order.ts`, `src/domain/order-lifecycle-validator.ts`, `tests/unit/services/order-service.spec.ts`, `tests/integration/order-placement.spec.ts`

**Acceptance Criteria:**
- `POST /api/v1/orders` accepts `{ symbol, side: BUY|SELL, quantity, price }` for authenticated CUSTOMER
- Cash sufficiency check: `available_cash >= price × quantity` using `Decimal.js` — NOT native float
- Insufficient funds → `InsufficientFundsException` → HTTP 422
- Successful order returns `{ id, status: PENDING, created_at }` (append-only record)
- **Trade ledger is append-only**: NO UPDATE or DELETE on orders table after EXECUTED

**Async test pattern (MANDATORY):**
```ts
// CORRECT:
await expect(orderService.placeOrder(input)).rejects.toThrow(InsufficientFundsException);
// WRONG — do NOT use:
expect(async () => await orderService.placeOrder(input)).toThrow(InsufficientFundsException);
```

---

### Story S08 — Order State Machine (AC-07)
**Layer:** api  
**Owner:** order-lifecycle-agent  
**Files:** `src/domain/order-lifecycle-validator.ts`, `src/controllers/order-controller.ts`, `tests/unit/domain/order-lifecycle-validator.spec.ts`

**Acceptance Criteria:**
- Valid transitions: `PENDING → EXECUTED`, `PENDING → CANCELLED`
- Invalid transition: `EXECUTED → *` raises `InvalidOrderStateException`
- `PUT /api/v1/orders/:id/execute` and `PUT /api/v1/orders/:id/cancel` enforce state machine
- ADMIN-only endpoint for manual execution/cancellation

---

### Story S09 — Daily Gainers & Losers Analytics (AC-10, NFR-01)
**Layer:** api  
**Owner:** portfolio-stats-agent  
**Files:** `src/controllers/analytics-controller.ts`, `src/services/analytics-service.ts`, `src/domain/stats-aggregator-rule.ts`, `src/domain/gainer-loser-item.ts`, `tests/unit/domain/stats-aggregator-rule.spec.ts`, `tests/integration/daily-gainers-losers.spec.ts`

**Acceptance Criteria:**
- `GET /api/v1/analytics/daily-stats` returns `{ gainers: [...], losers: [...] }` for authenticated user
- Gainers: top 5 holdings with `gain_percent >= 0`, sorted DESC
- Losers: top 5 holdings with `gain_percent < 0`, sorted ASC (largest loss first)
- `gain_percent = (current_price - avg_buy_price) / avg_buy_price × 100` — **Decimal.js only**
- All values serialised as strings with exactly 2 decimal places
- Empty holdings → `{ gainers: [], losers: [] }` (not an error)

**Exact AC-10-A scenario (must pass):**
| Symbol | Avg Buy | Current | gain_percent |
|--------|---------|---------|--------------|
| NVDA | 100.00 | 145.20 | 45.20 (gainer #1) |
| AAPL | 150.00 | 180.00 | 20.00 (gainer #2) |
| AMD | 150.00 | 116.25 | -22.50 (loser #1) |
| TSLA | 250.00 | 233.75 | -6.50 (loser #3) |
