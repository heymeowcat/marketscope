# Portfolio P&L Calculator Skill

## Purpose
Enforces deterministic fixed-point financial arithmetic (`Decimal.js`) for calculating customer portfolio valuation, weighted average cost basis, absolute P&L, and percentage return (AC-09, NFR-01).

## Mathematical Invariants

### 1. Cost Basis & Total Invested
$$\text{total\_invested} = \sum_{i=1}^k \left(\text{Decimal}(Q_i) \times \text{Decimal}(\bar{P}_{\text{buy}, i})\right)$$

### 2. Current Portfolio Valuation
$$\text{current\_value} = \sum_{i=1}^k \left(\text{Decimal}(Q_i) \times \text{Decimal}(P_{\text{market}, i})\right)$$

### 3. Absolute Profit & Loss
$$\text{absolute\_pnl} = \text{current\_value}.minus(\text{total\_invested})$$

### 4. Percentage Return
$$\text{percent\_pnl} = \begin{cases} \text{absolute\_pnl}.dividedBy(\text{total\_invested}).times(100) & \text{if } \text{total\_invested} > 0 \\ \text{Decimal}(0.00) & \text{if } \text{total\_invested} = 0 \end{cases}$$

## Verification Checklist
- [ ] No native `+`, `-`, `*`, `/` used on monetary quantities.
- [ ] Rounding mode configured to `Decimal.ROUND_HALF_UP`.
- [ ] Output strings formatted via `.toFixed(2)` for financial display.
- [ ] Division-by-zero guarded when customer holds zero positions or initial cash only.
- [ ] Validated against boundary cases ($10^{-4}$ penny increments, large cap positions).
