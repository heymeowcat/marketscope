# Stats Aggregator Skill

## Purpose
Aggregates customer portfolio holdings to extract the top 5 gainers and top 5 losers ranked by percentage return, and compiles platform-wide trade metrics (AC-10).

## Algorithm

### 1. Customer Daily Statistics (AC-10)
Given open positions $H = \{h_1, h_2, \dots, h_n\}$ where $Q_i > 0$:
1. For each position, compute gain percentage:
   $$\text{gain\_percent}_i = \left(\frac{P_{\text{market}, i} - \bar{P}_{\text{buy}, i}}{\bar{P}_{\text{buy}, i}}\right) \times 100$$
2. Partition into positive and negative sets:
   - $\text{Gainers} = \{h \in H \mid \text{gain\_percent}(h) \ge 0\}$
   - $\text{Losers} = \{h \in H \mid \text{gain\_percent}(h) < 0\}$
3. Sort Gainers descending by `gain_percent` and take top 5.
4. Sort Losers ascending by `gain_percent` (greatest loss first) and take top 5.
5. Format numbers with fixed 2 decimal places using `Decimal.js`.

### 2. Platform Operations Aggregation
- Count and sum nominal value of orders by status (`PENDING`, `EXECUTED`, `CANCELLED`, `REJECTED`).
- Identify top 10 most-traded symbols by transaction frequency and share volume.
- Calculate settlement queue volume pending end-of-day clearing.
