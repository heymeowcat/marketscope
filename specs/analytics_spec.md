# MarketScope — Analytics & Statistics Specification
## Feature Specification (specs/analytics_spec.md)
**Feature Area:** Customer Portfolio Analytics & Platform Market Statistics  
**Enforces Criteria:** AC-10  

---

## 1. Overview
The Analytics module provides actionable performance insights for individual retail investors (identifying the top 5 gainers and top 5 losers within their personal equity holdings) and administrative macro-level metrics (order volumes, settlement queues, and most-traded tickers).

---

## 2. Acceptance Criteria

### AC-10: Daily Top Gainers & Losers from Customer Holdings
Daily statistics endpoint returns the top 5 gainers and top 5 losers from the requesting customer's current holdings.

#### Algorithmic Definition:
For each holding $i$ currently held by customer $C$ (where holding quantity $Q_i > 0$):
$$\Delta \%_i = \left( \frac{P_{\text{market}, i} - \bar{P}_{\text{buy}, i}}{\bar{P}_{\text{buy}, i}} \right) \times 100$$
1. **Gainers:** Holdings sorted in descending order of $\Delta \%_i$ ($\Delta \% \ge 0$). Take at most 5 items.
2. **Losers:** Holdings sorted in ascending order of $\Delta \%_i$ ($\Delta \% < 0$). Take at most 5 items.
3. If customer holds fewer than 5 gainers or losers, return all available without padding nulls.
4. If customer holds zero positions, return empty arrays `{"gainers": [], "losers": []}`.

#### Given-When-Then Scenarios:
- **Scenario AC-10-A (Customer with 8 Holdings - 5 Gainers and 3 Losers):**
  - **Given** an authenticated customer holding 8 distinct stocks with varying P&L:
    - NVDA (+45.2%), AAPL (+20.0%), GOOGL (+15.1%), MSFT (+12.4%), AMZN (+8.0%), META (+4.2%), TSLA (-6.5%), INTC (-18.2%), AMD (-22.5%)
  - **When** `GET /api/v1/analytics/daily-stats` is called
  - **Then** `gainers` array contains exactly 5 stocks ordered: NVDA, AAPL, GOOGL, MSFT, AMZN
  - **And** `losers` array contains 3 stocks ordered by greatest loss: AMD (-22.5%), INTC (-18.2%), TSLA (-6.5%)
  - **And** HTTP 200 is returned with JSON:
    ```json
    {
      "customer_id": "cust-001",
      "timestamp": "2026-09-30T00:00:00.000Z",
      "gainers": [
        {"symbol": "NVDA", "gain_percent": "45.20", "current_price": "145.20", "avg_buy_price": "100.00"},
        {"symbol": "AAPL", "gain_percent": "20.00", "current_price": "180.00", "avg_buy_price": "150.00"},
        {"symbol": "GOOGL", "gain_percent": "15.10", "current_price": "172.65", "avg_buy_price": "150.00"},
        {"symbol": "MSFT", "gain_percent": "12.40", "current_price": "337.20", "avg_buy_price": "300.00"},
        {"symbol": "AMZN", "gain_percent": "8.00", "current_price": "194.40", "avg_buy_price": "180.00"}
      ],
      "losers": [
        {"symbol": "AMD", "gain_percent": "-22.50", "current_price": "116.25", "avg_buy_price": "150.00"},
        {"symbol": "INTC", "gain_percent": "-18.20", "current_price": "24.54", "avg_buy_price": "30.00"},
        {"symbol": "TSLA", "gain_percent": "-6.50", "current_price": "233.75", "avg_buy_price": "250.00"}
      ]
    }
    ```

- **Scenario AC-10-B (Customer with Zero Holdings):**
  - **Given** an authenticated customer who holds no stocks
  - **When** `GET /api/v1/analytics/daily-stats` is called
  - **Then** the response returns HTTP 200 with `{"gainers": [], "losers": []}`.

---

## 3. Platform & System Statistics (Admin)
- **Daily Order Volume by Status**: Aggregates count and total nominal value of orders grouped by status (`PENDING`, `EXECUTED`, `CANCELLED`, `REJECTED`).
- **Settlement Queue**: Count and details of executed orders pending end-of-day ledger reconciliation.
- **Most-Traded Symbols**: Top 10 symbols ranked by trade volume and transaction count across the platform.

---

## 4. API Specification

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/analytics/daily-stats` | `CUSTOMER` | Returns top 5 gainers and top 5 losers from customer holdings |
| `GET` | `/api/v1/analytics/sector-exposure` | `CUSTOMER` | Returns percentage distribution of invested capital by sector |
| `GET` | `/api/v1/admin/analytics/platform-stats` | `ADMIN` | Returns platform order volume, settlement queue, and most-traded tickers |

---

## 5. Test Tagging Matrix
- `[AC-10]`: `tests/unit/domain/StatsAggregatorRule.spec.ts`, `tests/integration/DailyGainersLosers.spec.ts`
