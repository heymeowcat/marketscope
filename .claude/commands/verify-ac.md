---
name: verify-ac
description: Verifies test coverage and implementation of all 10 MarketScope Acceptance Criteria (AC-01 through AC-10).
---

# /verify-ac — Acceptance Criteria Verification Suite

When this command is invoked:
1. Run all AC-tagged tests:
   ```bash
   npx vitest run --reporter=verbose --grep="\[AC-"
   ```
2. Verify that each criterion from AC-01 through AC-10 has at least one passing test:
   - `[AC-01]` Customer registration & active state
   - `[AC-02]` Admin role change & audit logging
   - `[AC-03]` Stock catalog CRUD & soft-delete invariant
   - `[AC-04]` Watchlist creation & 10-list cap
   - `[AC-05]` Watchlist atomic updates & WatchlistUpdateException
   - `[AC-06]` Order placement & PENDING state with server timestamp
   - `[AC-07]` Order lifecycle & InvalidOrderStateException
   - `[AC-08]` BUY order InsufficientFundsException guard
   - `[AC-09]` Portfolio statistics (total_invested, current_value, absolute_pnl, percent_pnl)
   - `[AC-10]` Daily top 5 gainers and top 5 losers from current holdings
3. Generate a Markdown summary table of test results and coverage percentages.
4. Block merge if any AC test fails or if any AC has 0 passing tests.
