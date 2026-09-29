---
name: check-role-boundaries
description: Audits controller routes and runs security integration tests to enforce CUSTOMER vs ADMIN role boundaries.
---

# /check-role-boundaries — Security & RBAC Isolation Audit

When this command is invoked:
1. Execute the static role boundary hook check:
   ```bash
   node .claude/hooks/role-boundary-check.js
   ```
2. Run negative authorization integration tests:
   ```bash
   npx vitest run tests/integration/AdminRoleProtection.spec.ts tests/architecture/RoleBoundary.spec.ts
   ```
3. Verify that:
   - All `/api/v1/admin/*` endpoints strictly require `ADMIN` role.
   - Any attempt by a `CUSTOMER` to access administrative endpoints receives HTTP 403 Forbidden.
   - Any attempt by unauthenticated callers receives HTTP 401 Unauthorized.
   - Suspended accounts cannot execute orders or modify data.
4. Report audit status: PASS (secure boundaries intact) or FAIL (leaks detected).
