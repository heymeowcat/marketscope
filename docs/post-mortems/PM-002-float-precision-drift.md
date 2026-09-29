# Post-Mortem PM-002: Floating Point Precision Drift in Portfolio P&L Math
**Incident Reference:** PM-002  
**Severity:** Critical  
**Date:** 2026-09-29  
**Status:** Resolved (Environment-First Resolution)  

---

## 1. Summary
During stress testing with 500 consecutive fractional stock purchases, the portfolio valuation endpoint returned `$1000.0000000000001` instead of `$1000.00`, causing floating-point rounding errors and failing NFR-01.

---

## 2. Root Cause
The generator agent implemented portfolio valuation using standard JavaScript operators (`+`, `*`, `/`) rather than the required `Decimal.js` fixed-point library. Due to binary floating-point representation (IEEE 754), operations such as `0.1 + 0.2` produced `0.30000000000000004`.

---

## 3. Environment-First Resolution
1. **Created Pre-Commit Hook**:
   Added `.claude/hooks/bigdecimal-financial-check.js` which searches AST/code patterns for primitive arithmetic (`+`, `-`, `*`, `/`) in financial files and blocks execution if `Decimal.js` is not used.
2. **Updated Specification**:
   Updated `specs/app_spec.md` and `specs/portfolio_spec.md` with explicit mathematical formulas mandating fixed-point decimal arithmetic and `ROUND_HALF_UP` rounding.
3. **Created Domain Skill**:
   Authored `.claude/skills/portfolio-pnl-calculator/SKILL.md` to instruct agents on exact `Decimal.js` syntax.
4. **Regenerated Code**:
   Regenerated `PortfolioPnLPolicy` with 100% `Decimal.js` math.

---

## 4. Verification
- 1,000 synthetic test cycles executed: zero drift detected.
- Verified in `tests/unit/domain/PortfolioPnLPolicy.spec.ts`.
