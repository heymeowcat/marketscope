# Architecture (MarketScope 4-Tier Blueprint)

## Layer Hierarchy

MarketScope strictly enforces a 4-tier architecture. Dependencies flow **downward only** — a layer may import from layers below it but never from layers above it.

```
┌─────────────────┐
│   Controllers   │  ← Layer 4 (HTTP REST endpoints, middleware, routing)
├─────────────────┤
│    Services     │  ← Layer 3 (Business transactions, domain orchestration, audit logging)
├─────────────────┤
│  Repositories   │  ← Layer 2 (Append-only trade ledgers, soft-deletion, data persistence)
├─────────────────┤
│     Domain      │  ← Layer 1 (Entities, pure rules, Decimal.js math, exceptions)
└─────────────────┘
```

### Layer Definitions

| Layer | Path | Responsibility | May Import From | May NOT Import |
|-------|------|---------------|-----------------|----------------|
| **Domain** | `src/domain/` | Pure business entities, state machines, domain rules, exceptions | `decimal.js` | Express, Repositories, Services, Controllers |
| **Repositories** | `src/repositories/` | Data persistence, append-only order ledgers, soft-delete updates | `src/domain/`, standard lib | Services, Controllers, Express |
| **Services** | `src/services/` | Transaction orchestration, domain coordination, balance checks | `src/domain/`, `src/repositories/` | Controllers, Express |
| **Controllers** | `src/controllers/` | Express route handlers, input validation, role checks, HTTP status mapping | `src/domain/`, `src/services/` | Repositories (DIRECT REPOSITORY ACCESS FORBIDDEN) |

## One-Way Dependency Rule

**Never import from a higher layer.**
- A `Service` importing from `Controllers` — FORBIDDEN
- A `Repository` importing from `Services` or `Controllers` — FORBIDDEN
- A `Domain` module importing from any layer — FORBIDDEN (pure business domain)
- A `Controller` directly importing a `Repository` — FORBIDDEN (must use Services)

## Architectural Validation

Architecture boundaries are strictly validated using `dependency-cruiser`:
```bash
npm run test:arch
```

## Cross-Cutting Concerns

The following concerns span all layers and are handled via shared utilities, not inline in each layer:

| Concern | Implementation |
|---------|---------------|
| **Logging** | Centralized logger (e.g., `src/lib/logger`) — all layers import from `lib`, not from each other |
| **Authentication** | Auth context passed via dependency injection or middleware; never hardcoded per-layer |
| **Telemetry** | Instrumentation via a shared `src/lib/telemetry` module with span/trace helpers |
| **Error Handling** | Typed error classes in `Types`; caught and mapped at `API` boundary; never swallowed silently |

## Customization

Layer names, paths, and verification commands can be overridden for non-standard stacks (e.g., monorepos, microservices, full-stack frameworks) via `project-manifest.json` in the project root.

Example override:
```json
{
  "layers": [
    { "name": "domain", "path": "src/domain", "rank": 1 },
    { "name": "application", "path": "src/application", "rank": 2 },
    { "name": "infrastructure", "path": "src/infrastructure", "rank": 3 },
    { "name": "presentation", "path": "src/presentation", "rank": 4 }
  ]
}
```

When `project-manifest.json` is present, the `check-architecture` hook reads layer definitions from it instead of using the defaults above.
