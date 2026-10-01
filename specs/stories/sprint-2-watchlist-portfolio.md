# Sprint 2: Watchlist & Portfolio Valuation

## Stories

### Story S04 — Watchlist Creation & Cap (AC-04)
**Layer:** api  
**Owner:** order-lifecycle-agent  
**Files:** `src/controllers/watchlist-controller.ts`, `src/services/watchlist-service.ts`, `src/repositories/watchlist-repository.ts`, `src/domain/watchlist.ts`, `src/domain/watchlist-limit-rule.ts`, `tests/unit/services/watchlist-service.spec.ts`, `tests/integration/watchlist-creation.spec.ts`

**Acceptance Criteria:**
- `POST /api/v1/watchlists` creates watchlist for authenticated CUSTOMER
- Maximum 10 watchlists per customer — 11th raises `WatchlistLimitExceededException` (422)
- Watchlist must have a name and ≥ 1 valid symbol — empty creation returns 422
- Duplicate watchlist name returns 409

**Entity Schema (MUST use enums — NOT string literals):**
```ts
{ id, userId, name, createdAt: Date }  // UserRole.CUSTOMER, UserStatus.ACTIVE
```

---

### Story S05 — Watchlist Atomic Symbol Updates (AC-05)
**Layer:** api  
**Owner:** order-lifecycle-agent  
**Files:** `src/controllers/watchlist-controller.ts`, `src/services/watchlist-service.ts`, `src/repositories/watchlist-symbol-repository.ts`, `tests/unit/services/watchlist-service.spec.ts`, `tests/integration/watchlist-atomic-update.spec.ts`

**Acceptance Criteria:**
- `PUT /api/v1/watchlists/:id/symbols` with `{ add: [], remove: [] }` performs atomic batch update
- If ANY symbol in `add` is DELISTED or unknown → entire transaction rolls back → `WatchlistUpdateException` (422)
- On success returns updated symbol list
- Non-owner access returns 403

---

### Story S06 — Portfolio Valuation & P&L (AC-09, NFR-01)
**Layer:** api  
**Owner:** portfolio-stats-agent  
**Files:** `src/controllers/portfolio-controller.ts`, `src/services/portfolio-service.ts`, `src/domain/portfolio-pnl-policy.ts`, `src/domain/holding.ts`, `src/repositories/holding-repository.ts`, `tests/unit/domain/portfolio-pnl-policy.spec.ts`, `tests/integration/portfolio-statistics.spec.ts`

**Acceptance Criteria:**
- `GET /api/v1/portfolio/stats` returns `{ total_invested, current_value, absolute_pnl, percent_pnl }` — all as 2dp strings
- `GET /api/v1/portfolio/holdings` returns per-symbol `{ symbol, quantity, avg_buy_price, current_price, unrealized_pnl }`
- All arithmetic uses `Decimal.js` — zero native float math
- `req.user?.userId` MUST be null-guarded with 401 before calling service

**Controller null-guard pattern (mandatory):**
```ts
const userId = req.user?.userId;
if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });
await this.portfolioService.getStats(userId);
```
