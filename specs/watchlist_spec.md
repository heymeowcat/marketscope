# MarketScope — Watchlist Specification
## Feature Specification (specs/watchlist_spec.md)
**Feature Area:** Customer Watchlist Management & Real-Time Tracking  
**Enforces Criteria:** AC-04, AC-05  

---

## 1. Overview
The Watchlist module allows retail customers to organize, monitor, and curate baskets of equities. The system strictly enforces a 10-watchlist cap per user, requires at least one initial symbol upon creation, and mandates atomic updates with rollbacks and explicit exception handling.

---

## 2. Acceptance Criteria

### AC-04: Watchlist Creation & 10-Watchlist Limit
Customer can create a watchlist with a name and at least one symbol; a customer may hold a maximum of 10 watchlists.

#### Given-When-Then Scenarios:
- **Scenario AC-04-A (Successful Watchlist Creation):**
  - **Given** an authenticated customer who currently has 3 watchlists
  - **When** `POST /api/v1/watchlists` is called with:
    ```json
    {
      "name": "Semiconductors",
      "symbols": ["NVDA", "TSM"]
    }
    ```
  - **Then** a new watchlist is created for the requesting customer
  - **And** the watchlist contains both "NVDA" and "TSM"
  - **And** an HTTP 201 Created response is returned with the watchlist ID.

- **Scenario AC-04-B (Empty Symbols Rejection):**
  - **Given** an authenticated customer
  - **When** `POST /api/v1/watchlists` is called with `{"name": "Tech", "symbols": []}`
  - **Then** the request is rejected with HTTP 422 Unprocessable Entity
  - **And** an error with message "Watchlist must contain at least one symbol" is returned.

- **Scenario AC-04-C (10-Watchlist Limit Exceeded):**
  - **Given** an authenticated customer who already owns 10 watchlists
  - **When** attempting to create an 11th watchlist via `POST /api/v1/watchlists`
  - **Then** the system raises `WatchlistLimitExceededException` (mapped to HTTP 400 Bad Request)
  - **And** no new watchlist record is persisted.

---

### AC-05: Atomic Watchlist Operations & Exception Handling
Watchlist operations (rename, add or remove symbols, delete) execute atomically — partial updates are rejected with `WatchlistUpdateException`.

#### Given-When-Then Scenarios:
- **Scenario AC-05-A (Atomic Batch Modification Success):**
  - **Given** an existing watchlist containing `["AAPL", "MSFT"]`
  - **When** `PUT /api/v1/watchlists/:id` is invoked to rename the list to "Big Tech" and add symbol "GOOGL"
  - **Then** both the name update and symbol addition are committed within a single database transaction
  - **And** an HTTP 200 response with the updated state is returned.

- **Scenario AC-05-B (Atomic Failure with Invalid Symbol - Partial Update Rollback):**
  - **Given** an existing watchlist with name "Old Name" and symbols `["AAPL"]`
  - **When** a batch update request is sent to rename the watchlist to "New Name" and add symbols `["NVDA", "INVALID_SYM_XYZ"]`
  - **And** "INVALID_SYM_XYZ" does not exist in the stock catalog
  - **Then** the service detects the invalid symbol
  - **And** the entire transaction rolls back immediately
  - **And** the name remains "Old Name" and the symbols remain `["AAPL"]`
  - **And** the service throws `WatchlistUpdateException` returning HTTP 422 with:
    ```json
    {
      "error": "WatchlistUpdateException",
      "message": "Watchlist atomic update failed: Symbol INVALID_SYM_XYZ does not exist in catalog"
    }
    ```

- **Scenario AC-05-C (Atomic Deletion):**
  - **Given** an existing watchlist
  - **When** `DELETE /api/v1/watchlists/:id` is requested
  - **Then** the watchlist and its symbol associations are deleted atomically in one transaction
  - **And** HTTP 204 No Content is returned.

---

## 3. Domain Rules & Invariants
1. Maximum watchlists per user: $N \le 10$.
2. Minimum symbols on creation: $S \ge 1$.
3. All watchlist modifications must be executed inside an explicit transactional boundary.
4. If any single symbol in a batch operation fails validation, the entire operation is rolled back and raises `WatchlistUpdateException`.

---

## 4. API Specification

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/watchlists` | `CUSTOMER` | List all watchlists for current user |
| `GET` | `/api/v1/watchlists/:id` | `CUSTOMER` | Get watchlist details with live quotes |
| `POST` | `/api/v1/watchlists` | `CUSTOMER` | Create new watchlist (requires name + >=1 symbol) |
| `PUT` | `/api/v1/watchlists/:id` | `CUSTOMER` | Atomically update watchlist name and symbols |
| `DELETE` | `/api/v1/watchlists/:id` | `CUSTOMER` | Atomically delete watchlist |

---

## 5. Test Tagging Matrix
- `[AC-04]`: `tests/unit/domain/WatchlistLimitRule.spec.ts`, `tests/integration/WatchlistCreation.spec.ts`
- `[AC-05]`: `tests/unit/services/WatchlistService.spec.ts`, `tests/integration/WatchlistAtomicUpdate.spec.ts`
