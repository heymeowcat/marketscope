# MarketScope — Trade Order Lifecycle & Execution Specification
## Feature Specification (specs/order_spec.md)
**Feature Area:** Order Placement, Validation, Execution Lifecycle, and Ledger Immutability  
**Enforces Criteria:** AC-06, AC-07, AC-08, NFR-01, NFR-02  

---

## 1. Overview
The Order Lifecycle module handles the validation, placement, matching stub, state transitions, and ledger persistence for stock trades. It enforces strict cash balance checks, fixed-point decimal arithmetic, explicit state machine transitions, and append-only database invariants.

---

## 2. Acceptance Criteria

### AC-06: Order Placement & Initial Pending State
Customer can place a market or limit order (`BUY` or `SELL`); the order enters `PENDING` state with a server-side timestamp.

#### Given-When-Then Scenarios:
- **Scenario AC-06-A (Market BUY Order Placement):**
  - **Given** an authenticated customer with sufficient cash
  - **When** `POST /api/v1/orders` is submitted with:
    ```json
    {
      "symbol": "AAPL",
      "side": "BUY",
      "order_type": "MARKET",
      "quantity": 10
    }
    ```
  - **Then** the order record is persisted with:
    - `status`: `PENDING`
    - `created_at`: UTC server-side timestamp
    - `symbol`: "AAPL"
    - `side`: "BUY"
    - `order_type`: "MARKET"
    - `quantity`: 10
    - `customer_id`: requesting user ID
  - **And** HTTP 201 Created is returned with the order entity.

- **Scenario AC-06-B (Limit SELL Order Placement):**
  - **Given** an authenticated customer who owns at least 5 shares of "MSFT"
  - **When** `POST /api/v1/orders` is submitted with `side = SELL`, `order_type = LIMIT`, `quantity = 5`, `limit_price = 450.00`
  - **Then** the order is saved in `PENDING` state with server-side timestamp.

---

### AC-07: Order Lifecycle State Machine Enforcement
Order lifecycle `PENDING` -> `EXECUTED` / `CANCELLED` / `REJECTED` is enforced; invalid transitions raise `InvalidOrderStateException`.

```
                    +-----------+
                    |  PENDING  |
                    +-----+-----+
                          |
        +-----------------+-----------------+
        |                 |                 |
        v                 v                 v
  +----------+      +-----------+     +----------+
  | EXECUTED |      | CANCELLED |     | REJECTED |
  +----------+      +-----------+     +----------+
```

#### Allowed State Transitions:
- `PENDING` -> `EXECUTED` (Upon matching/execution)
- `PENDING` -> `CANCELLED` (Customer cancellation before execution)
- `PENDING` -> `REJECTED` (Rejection due to market halt or rule breach)

#### Illegal State Transitions (must throw `InvalidOrderStateException`):
- `EXECUTED` -> `CANCELLED` (Cannot cancel an already executed order)
- `EXECUTED` -> `PENDING`
- `EXECUTED` -> `REJECTED`
- `CANCELLED` -> `EXECUTED`
- `CANCELLED` -> `PENDING`
- `REJECTED` -> `EXECUTED`

#### Given-When-Then Scenarios:
- **Scenario AC-07-A (Valid Execution):**
  - **Given** an order in `PENDING` state
  - **When** the execution engine processes the order
  - **Then** state transitions to `EXECUTED`
  - **And** executed price, executed quantity, and executed timestamp are stamped.

- **Scenario AC-07-B (Illegal Cancellation of Executed Order):**
  - **Given** an order with ID `ord-999` in `EXECUTED` status
  - **When** the customer calls `POST /api/v1/orders/ord-999/cancel`
  - **Then** the domain raises `InvalidOrderStateException` with message "Cannot transition order from EXECUTED to CANCELLED"
  - **And** HTTP 409 Conflict is returned
  - **And** the order status remains `EXECUTED`.

---

### AC-08: Insufficient Funds Guard for BUY Orders
`BUY` order fails with `InsufficientFundsException` when `quote_price * quantity` exceeds the customer's available cash.

#### Given-When-Then Scenarios:
- **Scenario AC-08-A (Insufficient Funds Failure):**
  - **Given** a customer with available cash balance of `$1,000.00`
  - **And** stock `AAPL` with current quote price of `$180.00`
  - **When** the customer submits a `BUY` order for 10 shares (total cost: `$1,800.00`)
  - **Then** the order validation detects `$1,800.00 > $1,000.00`
  - **And** the operation throws `InsufficientFundsException`
  - **And** HTTP 400 Bad Request is returned with:
    ```json
    {
      "error": "InsufficientFundsException",
      "required": "1800.00",
      "available": "1000.00",
      "message": "Required cash $1800.00 exceeds available balance $1000.00"
    }
    ```
  - **And** no order is created in the database
  - **And** customer's cash balance remains `$1,000.00`.

- **Scenario AC-08-B (Sufficient Funds Success & Cash Hold):**
  - **Given** a customer with available cash balance of `$5,000.00`
  - **When** the customer submits a `BUY` order for 10 shares of `AAPL` at `$180.00`
  - **Then** cash is reserved or deducted in a transaction
  - **And** the order is accepted in `PENDING` state.

---

## 3. Non-Functional Requirements

### NFR-01: Fixed-Point Financial Precision
- All price, quantity, and cash calculations MUST use `Decimal.js` (or `BigDecimal`).
- Under NO circumstance should native JavaScript floating-point numbers (`number`, `+`, `-`, `*`, `/`) be used for currency arithmetic.
- Precision: Cash and P&L values to 2 decimal places (cents), unit prices to 4 decimal places, quantities to integer or 4 decimal places.

### NFR-02: Immutability of Executed Orders and Trades
- Executed orders and trade records are **append-only**.
- Once an order enters `EXECUTED` state, it cannot be modified or deleted.
- Updates to `executed_price`, `quantity`, or `status` after execution are strictly blocked at domain and repository layers.
- Enforced by automated hook `executed-order-immutability-check.js`.

---

## 4. API Specification

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/orders` | `CUSTOMER` | List customer's orders |
| `GET` | `/api/v1/orders/:id` | `CUSTOMER` | Get order details |
| `POST` | `/api/v1/orders` | `CUSTOMER` | Place new BUY/SELL order (PENDING) |
| `POST` | `/api/v1/orders/:id/cancel` | `CUSTOMER` | Cancel pending order |
| `POST` | `/api/v1/orders/:id/execute` | Internal/Admin | Trigger execution stub |

---

## 5. Test Tagging Matrix
- `[AC-06]`: `tests/unit/services/OrderService.spec.ts`, `tests/integration/OrderPlacement.spec.ts`
- `[AC-07]`: `tests/unit/domain/OrderLifecycleStateMachine.spec.ts`, `tests/integration/OrderStateTransitions.spec.ts`
- `[AC-08]`: `tests/unit/domain/InsufficientFundsRule.spec.ts`, `tests/integration/OrderCashValidation.spec.ts`
- `[NFR-01]`: `tests/unit/domain/FinancialMathPrecision.spec.ts`
- `[NFR-02]`: `tests/architecture/TradeImmutability.spec.ts`
