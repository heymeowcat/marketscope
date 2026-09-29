# MarketScope — Portfolio Management & Valuation Specification
## Feature Specification (specs/portfolio_spec.md)
**Feature Area:** Customer Portfolio Holdings, Cost Basis, and P&L Valuation  
**Enforces Criteria:** AC-09, NFR-01  

---

## 1. Overview
The Portfolio module calculates customer positions, average cost basis per holding, total invested capital, real-time market valuation, and both absolute and percentage profit-and-loss (P&L). All financial math is strictly executed using fixed-point arithmetic (`Decimal.js`).

---

## 2. Acceptance Criteria

### AC-09: Portfolio Statistics & Valuation Metrics
Portfolio statistics endpoint returns `total_invested`, `current_value`, `absolute_pnl`, and `percent_pnl` for the requesting customer.

#### Mathematical Invariants (Fixed-Point Decimal):
For customer $C$ holding $k$ positions with quantity $Q_i$, average buy price $\bar{P}_{buy, i}$, and current market quote $P_{market, i}$:

1. **Total Invested Capital:**
   $$\text{total\_invested} = \sum_{i=1}^k (Q_i \times \bar{P}_{buy, i})$$

2. **Current Portfolio Valuation:**
   $$\text{current\_value} = \sum_{i=1}^k (Q_i \times P_{market, i})$$

3. **Absolute Profit & Loss:**
   $$\text{absolute\_pnl} = \text{current\_value} - \text{total\_invested}$$

4. **Percentage Profit & Loss:**
   $$\text{percent\_pnl} = \begin{cases} \left(\frac{\text{absolute\_pnl}}{\text{total\_invested}}\right) \times 100 & \text{if } \text{total\_invested} > 0 \\ 0.00 & \text{if } \text{total\_invested} = 0 \end{cases}$$

#### Given-When-Then Scenarios:
- **Scenario AC-09-A (Portfolio with Multiple Profitable Holdings):**
  - **Given** an authenticated customer holding:
    - 10 shares of `AAPL` bought at `$150.00` (current quote: `$180.00`)
    - 5 shares of `MSFT` bought at `$300.00` (current quote: `$360.00`)
  - **When** `GET /api/v1/portfolio/stats` is called
  - **Then** the endpoint calculates:
    - `total_invested`: $(10 \times 150) + (5 \times 300) = 1500.00 + 1500.00 = 3000.00$
    - `current_value`: $(10 \times 180) + (5 \times 360) = 1800.00 + 1800.00 = 3600.00$
    - `absolute_pnl`: $3600.00 - 3000.00 = +600.00$
    - `percent_pnl`: $(600.00 / 3000.00) \times 100 = +20.00\%$
  - **And** HTTP 200 is returned with JSON:
    ```json
    {
      "customer_id": "cust-001",
      "total_invested": "3000.00",
      "current_value": "3600.00",
      "absolute_pnl": "600.00",
      "percent_pnl": "20.00",
      "currency": "USD"
    }
    ```

- **Scenario AC-09-B (Portfolio with Zero Holdings / Cash Only):**
  - **Given** a customer with no executed stock holdings
  - **When** `GET /api/v1/portfolio/stats` is requested
  - **Then** `total_invested` is `"0.00"`, `current_value` is `"0.00"`, `absolute_pnl` is `"0.00"`, and `percent_pnl` is `"0.00"`
  - **And** no division-by-zero error occurs.

- **Scenario AC-09-C (Detailed Holdings Breakdown):**
  - **Given** customer holdings
  - **When** `GET /api/v1/portfolio/holdings` is called
  - **Then** each holding item includes:
    - `symbol`: string
    - `company_name`: string
    - `quantity`: number
    - `avg_buy_price`: fixed-point decimal string
    - `current_price`: fixed-point decimal string
    - `current_value`: fixed-point decimal string
    - `unrealized_pnl`: fixed-point decimal string
    - `unrealized_pnl_percent`: fixed-point decimal string.

---

## 3. Non-Functional Requirements

### NFR-01: Zero Floating-Point Drift
- Every addition, subtraction, multiplication, and division in the P&L engine must use `Decimal.js` methods (`.plus()`, `.minus()`, `.times()`, `.dividedBy()`, `.toDecimalPlaces(2)`).
- Enforced by automated AST hook `bigdecimal-financial-check.js`.

---

## 4. API Specification

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/portfolio/stats` | `CUSTOMER` | Returns total_invested, current_value, absolute_pnl, percent_pnl |
| `GET` | `/api/v1/portfolio/holdings` | `CUSTOMER` | List all open positions with individual P&L |
| `GET` | `/api/v1/portfolio/summary` | `CUSTOMER` | Combined cash balance, holdings, and statistics |

---

## 5. Test Tagging Matrix
- `[AC-09]`: `tests/unit/domain/PortfolioPnLPolicy.spec.ts`, `tests/integration/PortfolioStatistics.spec.ts`
- `[NFR-01]`: `tests/unit/domain/PnLPrecisionEdgeCases.spec.ts`
