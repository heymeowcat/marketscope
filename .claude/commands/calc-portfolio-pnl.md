---
name: calc-portfolio-pnl
description: Runs fixed-point portfolio valuation and validates P&L formulas and top gainers/losers rankings.
---

# /calc-portfolio-pnl — Financial Mathematics & Valuation Audit

When this command is invoked:
1. Run financial precision hook to detect any floating point leaks:
   ```bash
   node .claude/hooks/bigdecimal-financial-check.js
   ```
2. Run fixed-point math and edge-case unit tests:
   ```bash
   npx vitest run tests/unit/domain/PortfolioPnLPolicy.spec.ts tests/unit/domain/FinancialMathPrecision.spec.ts tests/unit/domain/StatsAggregatorRule.spec.ts
   ```
3. Verify:
   - Zero IEEE 754 precision drift across 1,000 synthetic transaction cycles.
   - P&L division by zero guarded when invested capital is zero.
   - Top 5 gainers and losers correctly partitioned and sorted.
