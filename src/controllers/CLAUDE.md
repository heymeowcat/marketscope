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
- **Structured Error Responses**: Always return consistent JSON:
  ```json
  {
    "error": "ErrorType",
    "message": "Human readable message",
    "correlationId": "req-uuid"
  }
  ```
