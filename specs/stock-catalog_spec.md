# MarketScope — Stock Catalog Specification
## Feature Specification (specs/stock-catalog_spec.md)
**Feature Area:** Stock Catalog Administration, Search, and Market Data Feed  
**Enforces Criteria:** AC-03  

---

## 1. Overview
The Stock Catalog module maintains the master universe of tradeable equity symbols, company metadata, sectoral classifications, exchange listings, and real-time market price quotes via a scheduled random-walk price feed stub.

---

## 2. Acceptance Criteria

### AC-03: Stock Catalog CRUD & Soft-Delete Invariant
Stock catalog supports full CRUD for `ADMIN` role; soft-delete moves a symbol to `DELETED` / `DELISTED` status — symbols are never hard-deleted.

#### Given-When-Then Scenarios:
- **Scenario AC-03-A (Admin Creates Stock Symbol):**
  - **Given** an authenticated user with `role = ADMIN`
  - **When** `POST /api/v1/admin/stocks` is submitted with:
    ```json
    {
      "symbol": "NVDA",
      "company_name": "NVIDIA Corporation",
      "sector": "Technology",
      "exchange": "NASDAQ",
      "initial_price": "125.50"
    }
    ```
  - **Then** the stock record is created with `status = ACTIVE`
  - **And** current price is initialized to `125.50` (using fixed-point Decimal)
  - **And** an HTTP 201 Created response is returned with the created entity.

- **Scenario AC-03-B (Admin Soft-Deletes Stock Symbol):**
  - **Given** an active stock symbol `NVDA` in the database
  - **When** `DELETE /api/v1/admin/stocks/NVDA` is requested by an `ADMIN`
  - **Then** the record is NOT removed from the database table (no `DELETE FROM stocks`)
  - **And** the record's `status` column is updated to `DELISTED`
  - **And** `delisted_at` timestamp is populated
  - **And** subsequent customer catalog search queries omit `NVDA` unless specifically requested with administrative flags
  - **And** an HTTP 200 OK response with `{"message": "Stock delisted successfully", "status": "DELISTED"}` is returned.

- **Scenario AC-03-C (Attempted Hard-Delete Blocked):**
  - **Given** any stock catalog persistence operation
  - **When** a hard delete query is intercepted
  - **Then** the repository throws an error and rejects physical deletion.

- **Scenario AC-03-D (Customer Catalog Search & Browse):**
  - **Given** authenticated customer or anonymous visitor
  - **When** `GET /api/v1/stocks?sector=Technology&exchange=NASDAQ&search=NV` is called
  - **Then** all matching `ACTIVE` stocks are returned with current price quote
  - **And** any `DELISTED` stocks are excluded from results.

---

## 3. Market Data Feed Stub
- Market prices are served via an internal market data service.
- The service periodically ticks (default: every 5 seconds) applying a configurable random-walk percentage ($\Delta \in [-1.5\%, +1.5\%]$) to all active symbols.
- All price calculations preserve 4 decimal places of precision using fixed-point math (`Decimal.js`).

---

## 4. API Specification

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/stocks` | Any | Browse and search active stock catalog |
| `GET` | `/api/v1/stocks/:symbol` | Any | Get stock details and current quote |
| `POST` | `/api/v1/admin/stocks` | `ADMIN` | Create new stock entry |
| `PUT` | `/api/v1/admin/stocks/:symbol` | `ADMIN` | Update company metadata or sector |
| `DELETE` | `/api/v1/admin/stocks/:symbol` | `ADMIN` | Soft-delete symbol (sets status to `DELISTED`) |

---

## 5. Test Tagging Matrix
- `[AC-03]`: `tests/unit/services/StockCatalogService.spec.ts`, `tests/integration/StockCatalogAdmin.spec.ts`, `tests/unit/domain/StockSoftDeleteRule.spec.ts`
