# Controllers Layer Guidelines (src/controllers/CLAUDE.md)

## 1. Responsibilities
- Validate incoming HTTP request payload schema (using Zod or validation decorators).
- Enforce authentication and role-based access control (RBAC).
- Extract authenticated user context (`req.user`) and pass explicit parameters to services.
- Map service outcomes and domain exceptions to appropriate HTTP response codes.

## 2. Mandatory Rules
- **Role Boundary Enforcement (NFR-04)**:
  - Admin endpoints (`/api/v1/admin/*`) MUST be protected with role verification middleware requiring `role === 'ADMIN'`.
  - Customer endpoints (`/api/v1/customer/*`, `/api/v1/orders/*`, `/api/v1/watchlists/*`) MUST verify `role === 'CUSTOMER' || role === 'ADMIN'` and block `SUSPENDED` users.
- **Never Access Repositories**: Controllers must inject and invoke `*Service` classes only. Direct database or repository calls are strictly prohibited and blocked by architecture tests.
- **No Business Logic**: Calculations, state transition validations, and balance checks belong in domain rules and services, not controllers.
- **Router Mounting & Path Conventions (No Duplicate Prefixes)**:
  - Controllers are mounted in `app.ts` with resource prefixes (e.g. `app.use('/api/v1/stocks', stockCatalogController.getRouter())` or `app.use('/api/v1/admin/stocks', stockAdminController.getRouter())`).
  - Inside the controller's `setupRoutes()`, routes MUST be relative to the mount point:
    - Search/List: `this.router.get('/', ...)` (NOT `this.router.get('/stocks', ...)`)
    - Entity by ID: `this.router.get('/:symbol', ...)` (NOT `this.router.get('/stocks/:symbol', ...)`)
    - Create: `this.router.post('/', ...)`
    - Update: `this.router.put('/:symbol', ...)`
    - Delete: `this.router.delete('/:symbol', ...)`
- **Strict Null Checks on Authenticated Context**:
  - `req.user?.userId` can be undefined under TypeScript strict null checks.
  - ALWAYS guard extracted user IDs before passing to services that expect `string`:
    ```ts
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }
    ```
- **Health Check Routes (NFR-07)**:
  - Health check MUST be reachable at both `/health` and `/api/health` for Playwright webServer readiness and monitoring:
    ```ts
    app.get(['/health', '/api/health'], (req, res) => {
      res.status(200).json({ status: 'ok', uptime: process.uptime() });
    });
    ```
- **Structured Error Responses**: Always return consistent JSON:
  ```json
  {
    "error": "ErrorType",
    "message": "Human readable message",
    "correlationId": "req-uuid"
  }
  ```
