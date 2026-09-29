# Knowledge Deposits Log
## MarketScope Engineering Substrate (docs/knowledge-deposits.md)

---

## Overview
A Knowledge Deposit is a mechanism by which an observed mistake or edge-case failure made by an AI agent is permanently codified back into substrate guardrails (hooks, rules, or skills) so that no future agent can repeat it.

---

## Log of Codified Knowledge Deposits

### KD-001: Prohibition of Native Floating-Point Math for Currency (NFR-01)
- **Observed Failure**: Generator agent used `price * quantity` and `(currentValue - totalInvested) / totalInvested` using standard JavaScript `number` arithmetic, causing fractional penny drift (`$0.30000000000000004`).
- **Codified Substrate Rule**:
  - Pre-commit Hook: `.claude/hooks/bigdecimal-financial-check.js` (scans financial files and aborts if native float math is used).
  - Skill: `.claude/skills/portfolio-pnl-calculator/SKILL.md` (provides exact `Decimal.js` patterns).
  - Domain Policy: `src/domain/PortfolioPnLPolicy.ts` enforces `Decimal.ROUND_HALF_UP`.
- **Result**: Zero floating-point rounding errors across all subsequent builds.

---

### KD-002: Role Boundary Protection for Admin Endpoints (NFR-04)
- **Observed Failure**: Generator agent mounted administrative endpoints under `/api/v1/admin/*` using generic authentication middleware without explicit role checks.
- **Codified Substrate Rule**:
  - Pre-commit Hook: `.claude/hooks/role-boundary-check.js` (blocks any route under `/admin` without `requireRole('ADMIN')`).
  - Architecture Rule: Codified in `tests/architecture/layering.spec.ts`.
  - Layered CLAUDE.md: Documented in `src/controllers/CLAUDE.md`.
- **Result**: 100% role-boundary isolation guaranteed at static analysis and runtime.

---

### KD-003: Immutability of Executed Orders and Trades (NFR-02)
- **Observed Failure**: An agent attempting to implement order cancellation issued an `UPDATE orders SET status = 'CANCELLED'` without checking if the order had already entered `EXECUTED` status.
- **Codified Substrate Rule**:
  - Domain State Machine: `OrderLifecycleValidator.validateTransition()` explicitly blocks transitions out of `EXECUTED` and raises `InvalidOrderStateException`.
  - Repository Hook: `.claude/hooks/executed-order-immutability-check.js` blocks any SQL query attempting to delete or mutate executed orders.
- **Result**: Append-only audit integrity guaranteed across order history.

---

### KD-004: Soft-Delete Invariant on Stock Catalog (AC-03)
- **Observed Failure**: Generator agent implemented catalog removal using `DELETE FROM stocks WHERE symbol = ?`, destroying foreign key integrity for past trade history.
- **Codified Substrate Rule**:
  - Domain Invariant: `StockSoftDeleteRule.assertPhysicalDeleteForbidden()`.
  - Repository Pattern: Stock removal translates exclusively to `UPDATE stocks SET status = 'DELISTED', delisted_at = ?`.
- **Result**: Complete provenance and auditability of historical equities.
