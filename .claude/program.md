# Program

## Instructions

## Instructions

<!-- BC-AINE-006: MarketScope — Stock Trading & Portfolio Analytics Platform -->
<!-- Populated from Business Case document. This drives the autonomous /auto loop. -->

**Business Case ID:** BC-AINE-006  
**Domain:** FinTech — Capital Markets / Retail Brokerage  
**Stack:** Node.js + Express + TypeScript · SQLite · React + Vite · Decimal.js · Vitest · Playwright

### Functional Requirements (Acceptance Criteria)

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| AC-01 | Customer Registration | POST /api/v1/auth/register creates user in ACTIVE state with role=CUSTOMER and initial cash credit |
| AC-02 | Admin Role Management | Admin can promote/demote customer roles; all changes written to append-only audit log with actor, target, old/new roles, UTC timestamp |
| AC-03 | Stock Catalog Admin | Admin CRUD on stock symbols; deletion sets status=DELISTED (soft delete only — no hard deletes) |
| AC-04 | Watchlist Creation | Customers create watchlists (max 10 per customer, min 1 symbol per list); duplicate lists rejected |
| AC-05 | Watchlist Atomic Updates | Batch symbol add/remove is atomic — any invalid ticker rolls back entire batch |
| AC-06 | Order Placement | Customers place BUY/SELL orders; cash balance sufficiency checked before order accepted |
| AC-07 | Order State Machine | Orders transition: PENDING → EXECUTED or CANCELLED; executed orders are immutable |
| AC-08 | Insufficient Funds Guard | Orders rejected with 422 + `InsufficientFundsException` when cash < order total |
| AC-09 | Portfolio Valuation | GET /api/v1/portfolio/stats returns total_invested, current_value, absolute_pnl, percent_pnl using Decimal.js |
| AC-10 | Daily Gainers & Losers | GET /api/v1/analytics/daily-stats returns top 5 gainers (DESC) and top 5 losers (ASC) with fixed-point gain_percent |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | All financial values computed with Decimal.js (no IEEE 754 floating point). Serialised as strings with 2 decimal places. |
| NFR-02 | Trade ledger is append-only. No UPDATE/DELETE on executed orders. |
| NFR-03 | Passwords stored as bcrypt hashes (salt rounds ≥ 10). Never logged or returned in responses. |
| NFR-04 | Admin-only endpoints return 403 for non-admin roles. Role checked at controller layer. |
| NFR-05 | JWT authentication on all protected endpoints. Missing/invalid token returns 401. |
| NFR-06 | Test coverage ≥ 80% (hard floor). Target: 100% meaningful coverage (ratchet gate). |
| NFR-07 | Health endpoint at /health and /api/health returns 200 within 500ms. |
| NFR-08 | Architecture validated by dependency-cruiser. No controller → repository imports. |

### Sprint Plan

| Sprint | Stories | Branch |
|--------|---------|--------|
| Sprint 1 | AC-01, AC-02, AC-03, NFR-03, NFR-04 | feat/sprint1-foundation |
| Sprint 2 | AC-04, AC-05, AC-09, NFR-01 | feat/sprint2-watchlist-portfolio |
| Sprint 3 | AC-06, AC-07, AC-08, AC-10, NFR-01, NFR-02 | feat/sprint3-orders-analytics |

### Key Rules for Autonomous Execution

1. Read `.claude/state/learned-rules.md` before every implementation group.
2. 4-tier layer: controllers → services → domain → repositories. No skip-layer imports.
3. Router paths relative to mount point: `/` and `/:id`, never repeat resource prefix.
4. Guard `req.user?.userId` with 401 early return before passing to services.
5. Use `await expect(promise).rejects.toThrow(Ex)` — never `expect(async () => ...).toThrow()`.
6. Use domain enums in tests: `UserRole.CUSTOMER`, `UserStatus.ACTIVE`, not string literals.
7. Run `npm run build` before `npm run test:e2e`. Health check on both `/health` and `/api/health`.


## Constraints

- **Layered architecture:** All code must respect the layer hierarchy defined in `architecture.md`. No cross-layer imports in forbidden directions.
- **Review gate:** Every sprint/iteration must pass the review gate before advancing to the next phase.
- **Max retries:** No more than 3 consecutive auto-fix attempts per error category before escalating to a human.
- **No new dependencies without noting:** Any new package or library added must be logged in the current iteration's status block.
- **Self-heal before revert:** Always attempt automated self-healing (see Self-Healing Policy) before reverting to a prior commit.
- **Never delete learned rules:** Rules discovered during a session (error patterns, project-specific fixes) must be preserved in memory and never removed.
- **TDD mandatory:** Write failing tests FIRST, then implement code to make them pass. Never write implementation before tests. Tests define the contract; code fulfills it.
- **100% meaningful coverage:** Every line of generated code must be covered by tests. Coverage is not about bug prevention — it's about guaranteeing the agent has double-checked the behavior of every line it wrote (ref: "AI is forcing us to write good code" by Steve Krenzel). At 100%, any uncovered line is an immediate, unambiguous signal of missing verification.
- **Coverage floor: 80%.** The ratchet gate BLOCKS any commit that drops coverage below 80%. Target is 100% — 80% is the absolute minimum, not the goal.
- **Model tiering:** Use Opus for orchestration/evaluation (judgment tasks), Sonnet for implementation teammates (execution tasks). Configure via project-manifest.json.

## Stopping Criteria

The autonomous `/auto` loop terminates when any of the following conditions are met:

| Condition | Description |
|-----------|-------------|
| All features pass | Every story in the current sprint has passing tests and a green review gate |
| 3 consecutive failures | The same error category fails 3 times in a row without progress |
| Architecture violation | A layer dependency violation is detected and cannot be auto-fixed |
| Coverage below threshold | Test coverage drops below the project baseline and cannot be recovered in one iteration |
| Max iterations | The configured maximum iteration count is reached (default: 50, configured in project-manifest.json) |

## Self-Healing Policy

When an automated check fails, apply the fix strategy from the table below before re-running. If the fix strategy fails after the max retry count, stop and report.

| Category | Signal | Auto-fix |
|----------|--------|----------|
| Lint/format | ruff/eslint fails | `ruff check --fix && ruff format` |
| Type error | mypy/tsc reports type errors | Fix annotation or cast at the error site |
| Test failure | pytest/vitest fails | Fix code under test; never modify the test to make it pass |
| Import error | `ImportError` / `ModuleNotFoundError` at runtime | Fix layer placement or missing `__init__` |
| Coverage drop | Coverage falls below baseline | Add targeted tests for uncovered lines |
| API check fail | Evaluator returns 500/404 or wrong response schema | Read error message, fix service logic or router handler |
| Playwright fail | Element not found / wrong state in browser test | Read selector, fix component rendering or interaction |
| Design score low | Critic scores UI below threshold | Apply critique feedback, regenerate affected component |
| Docker fail | Container fails to start or health check fails | Read container logs, fix config or dependency issue |
| Architecture drift | Response shape does not match declared schema | Read schema definition, fix response serialization |

## Pipeline Status

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 1 | BRD | COMPLETE | BC-AINE-006 loaded into program.md |
| 2 | Spec | COMPLETE | All 7 spec files in specs/ |
| 3 | Design | COMPLETE | component-map.md + architecture.md |
| 4 | Implement | COMPLETE | Sprint 1-3 merged (AC-01 through AC-10, NFR-01 through NFR-08) |
| 5 | Review | COMPLETE | Evaluator reports in specs/reviews/ (Sprint 1: 94/100, Sprint 2: 96/100, Sprint 3: 95/100) |
| 6 | Test | COMPLETE | 261 tests passing (unit + integration + E2E + arch) |
| 7 | Deploy | NOT REQUIRED | Local Node.js + SQLite; no Docker deployment in scope |
| 8 | Commit | COMPLETE | All sprints merged to main; substrate fixes committed |

## Current Focus

```
iteration : 4  (Sprint 1 + Sprint 2 + Sprint 3 + substrate-repair)
status    : complete
story     : substrate gap repair
phase     : post-sprint maintenance
coverage  : 261 tests passing
```
