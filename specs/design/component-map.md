# Component Map — Sprint 2 Watchlist & Portfolio Features

## Ownership Matrix

### Watchlist Feature (AC-04, AC-05)

| Component | File | Owner | Produces | Consumes |
|-----------|------|-------|----------|----------|
| Domain | `src/domain/watchlist.ts` | watchlist-teammate | Watchlist entity, invariants | Stock entity |
| Domain Rules | `src/domain/watchlist-limit-rule.ts` | watchlist-teammate | WatchlistLimitExceededException | - |
| Domain Exceptions | `src/domain/exceptions.ts` (extend) | watchlist-teammate | WatchlistUpdateException | - |
| Repository | `src/repositories/watchlist-repository.ts` | watchlist-teammate | IWatchlistRepository interface | - |
| Repository (join) | `src/repositories/watchlist-symbol-repository.ts` | watchlist-teammate | IWatchlistSymbolRepository | - |
| Service | `src/services/watchlist-service.ts` | watchlist-teammate | WatchlistService (atomic ops) | Watchlist, Stock repos |
| Controller | `src/controllers/watchlist-controller.ts` | watchlist-teammate | Watchlist API routes | WatchlistService |
| Tests | `tests/unit/domain/watchlist-limit-rule.spec.ts` | watchlist-teammate | [AC-04] [AC-05] | - |
| Tests | `tests/unit/services/watchlist-service.spec.ts` | watchlist-teammate | [AC-04] [AC-05] | - |
| Tests | `tests/integration/watchlist-creation.spec.ts` | watchlist-teammate | [AC-04] | - |
| Tests | `tests/integration/watchlist-atomic-update.spec.ts` | watchlist-teammate | [AC-05] | - |

### Portfolio Feature (AC-09, NFR-01)

| Component | File | Owner | Produces | Consumes |
|-----------|------|-------|----------|----------|
| Domain (Order stub) | `src/domain/order.ts` | portfolio-teammate | Order entity (minimal) | Stock entity |
| Domain (Holding) | `src/domain/holding.ts` | portfolio-teammate | Holding entity | - |
| Domain Rules | `src/domain/portfolio-pnl-policy.ts` | portfolio-teammate | P&L calculation logic | Decimal.js |
| Domain Exceptions | `src/domain/exceptions.ts` (extend) | portfolio-teammate | PortfolioException | - |
| Repository (Holding) | `src/repositories/holding-repository.ts` | portfolio-teammate | IHoldingRepository | - |
| Repository (Order) | `src/repositories/order-repository.ts` | portfolio-teammate | IOrderRepository (append-only) | - |
| Service | `src/services/portfolio-service.ts` | portfolio-teammate | PortfolioService (stats, holdings) | Holding, Stock repos, P&L policy |
| Controller | `src/controllers/portfolio-controller.ts` | portfolio-teammate | Portfolio API routes | PortfolioService |
| Tests | `tests/unit/domain/portfolio-pnl-policy.spec.ts` | portfolio-teammate | [AC-09] [NFR-01] | - |
| Tests | `tests/unit/domain/pnl-precision-edge-cases.spec.ts` | portfolio-teammate | [NFR-01] | - |
| Tests | `tests/integration/portfolio-statistics.spec.ts` | portfolio-teammate | [AC-09] | - |

### Integration Points

| Layer | Shared File | Action | Timeline |
|-------|------------|--------|----------|
| Exceptions | `src/domain/exceptions.ts` | Extend with Watchlist + Portfolio exceptions | Phase 0 (both teams write, no conflict) |
| App Router | `src/app.ts` | Wire watchlist + portfolio controllers | Phase 3 (after both complete) |
| Types | `src/domain/user.ts` | Extend with customer_id reference | Already available |

## Phases

- **Phase 1 (Parallel)**: Watchlist team + Portfolio team implement domain, services, repositories (each owns separate files)
- **Phase 2 (Parallel)**: Watchlist team + Portfolio team write tests, implement controllers
- **Phase 3 (Sequential)**: Integrate app.ts router wiring, run full suite

## Constraints

- **File ownership is strict**: Each team touches only their assigned files
- **No cross-team live edits**: Exceptions extend in both teams' plans are declared upfront
- **All-or-nothing tests**: Both teams must achieve 100% meaningful AC coverage before integration
- **TDD mandatory**: Tests written and failing before implementation code
