# MarketScope System Architecture
## Technical Architecture & Layered Design (docs/architecture.md)

---

## 1. Architectural Overview & C4 Model

MarketScope implements a clean, 4-tier enterprise architecture engineered for strict role separation, append-only regulatory ledgers, and deterministic fixed-point financial calculations.

### 1.1 C4 Context Diagram
```mermaid
C4Context
    title System Context Diagram — MarketScope Brokerage Platform

    Person(customer, "Retail Customer", "Self-service investor trading equities and tracking portfolio analytics")
    Person(admin, "Brokerage Admin", "Internal compliance & operations managing catalog and user accounts")
    
    System(marketscope, "MarketScope Platform", "Stock trading, order lifecycle, watchlist management, and portfolio statistics")
    
    System_Ext(marketfeed, "Market Data Feed Stub", "Provides periodic price updates with random-walk tick")

    Rel(customer, marketscope, "Places orders, manages watchlists, views P&L", "HTTPS / JSON")
    Rel(admin, marketscope, "Curates stock catalog, audits roles, views platform metrics", "HTTPS / JSON")
    Rel(marketscope, marketfeed, "Polls live price quotes", "Internal REST")
```

### 1.2 C4 Container Diagram
```mermaid
C4Container
    title Container Diagram — MarketScope Architecture

    Person(customer, "Retail Customer")
    Person(admin, "Brokerage Admin")

    Container(frontend, "Single Page Application", "React, Vite, TypeScript", "Responsive UI for desktop and mobile")
    Container(backend, "API Gateway & Application Server", "Node.js, Express, TypeScript", "Provides REST APIs, enforces authentication, role guards, and business orchestration")
    ContainerDb(database, "Relational Database", "SQLite / PostgreSQL", "Stores users, stock catalog, watchlists, append-only orders, and audit logs")

    Rel(customer, frontend, "Interacts with", "Browser")
    Rel(admin, frontend, "Interacts with", "Browser")
    Rel(frontend, backend, "Makes API calls to", "JSON / HTTPS")
    Rel(backend, database, "Reads/Writes with append-only invariants", "SQL")
```

---

## 2. 4-Tier Layered Architecture

```mermaid
graph TD
    subgraph Presentation Layer
        C[Controllers & Route Handlers]
        MW[Auth Middleware & Role Guards]
    end

    subgraph Service Layer
        AS[AuthService]
        SS[StockService]
        WS[WatchlistService]
        OS[OrderService]
        PS[PortfolioService]
        ANS[AnalyticsService]
    end

    subgraph Domain Layer
        D1[OrderLifecycleValidator]
        D2[InsufficientFundsRule]
        D3[WatchlistLimitRule]
        D4[PortfolioPnLPolicy]
        D5[StockSoftDeleteRule]
    end

    subgraph Repository Layer
        R1[UserRepository]
        R2[StockRepository - Soft Delete]
        R3[WatchlistRepository - Atomic]
        R4[OrderRepository - Append-Only]
        R5[AuditLogRepository - Append-Only]
    end

    C --> MW
    MW --> AS
    MW --> SS
    MW --> WS
    MW --> OS
    MW --> PS
    MW --> ANS

    OS --> D1
    OS --> D2
    WS --> D3
    PS --> D4
    ANS --> D4
    SS --> D5

    AS --> R1
    SS --> R2
    WS --> R3
    OS --> R4
    AS --> R5

    style D1 fill:#f9f,stroke:#333,stroke-width:2px
    style D2 fill:#f9f,stroke:#333,stroke-width:2px
    style D3 fill:#f9f,stroke:#333,stroke-width:2px
    style D4 fill:#f9f,stroke:#333,stroke-width:2px
    style D5 fill:#f9f,stroke:#333,stroke-width:2px
```

### Layer Constraints:
1. **Controllers**: Input validation, JWT extraction, role checks (`requireRole('ADMIN')` vs `requireRole('CUSTOMER')`). Must NEVER import repositories.
2. **Services**: Transaction boundaries and business orchestration.
3. **Domain Layer**: Pure business logic, zero framework dependencies, fixed-point math (`Decimal.js`).
4. **Repositories**: Data access with strict append-only constraints on executed trades and audit logs.

---

## 3. Order Placement Sequence Diagram (AC-06, AC-07, AC-08)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Retail Customer
    participant Controller as OrderController
    participant Service as OrderService
    participant Domain as InsufficientFundsRule & OrderValidator
    participant OrderRepo as OrderRepository (Append-Only)
    participant AccountRepo as AccountRepository

    Customer->>Controller: POST /api/v1/orders (BUY 10 AAPL @ $180.00)
    Controller->>Controller: Verify JWT & Customer Role
    Controller->>Service: placeOrder(customerId, "AAPL", "BUY", 10, "MARKET")
    Service->>AccountRepo: getAvailableCash(customerId)
    AccountRepo-->>Service: cash = $1,000.00
    Service->>Domain: validateBuyFunds(cash, quotePrice=$180, qty=10)
    Note over Domain: Required: $1,800.00 > Available: $1,000.00!
    Domain-->>Service: throw InsufficientFundsException(required=1800, available=1000)
    Service-->>Controller: Exception caught
    Controller-->>Customer: HTTP 400 Bad Request (INSUFFICIENT_FUNDS)

    Note over Customer, AccountRepo: Alternative Path: Sufficient Funds ($5,000.00 cash)
    Customer->>Controller: POST /api/v1/orders (BUY 10 AAPL @ $180.00)
    Controller->>Service: placeOrder(customerId, "AAPL", "BUY", 10, "MARKET")
    Service->>AccountRepo: getAvailableCash(customerId)
    AccountRepo-->>Service: cash = $5,000.00
    Service->>Domain: validateBuyFunds(cash, quotePrice=$180, qty=10)
    Domain-->>Service: { requiredCash: 1800.00, remainingCash: 3200.00 }
    Service->>OrderRepo: insertOrder(status="PENDING", timestamp=UTC_NOW)
    OrderRepo-->>Service: orderId = "ord-101"
    Service->>AccountRepo: reserveCash(customerId, 1800.00)
    Service-->>Controller: OrderCreated (status="PENDING")
    Controller-->>Customer: HTTP 201 Created (ord-101, status="PENDING")
```
