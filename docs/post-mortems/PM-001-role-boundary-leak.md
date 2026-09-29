# Post-Mortem PM-001: Customer Role Boundary Leak on User Suspension Endpoint
**Incident Reference:** PM-001  
**Severity:** High  
**Date:** 2026-09-29  
**Status:** Resolved (Environment-First Resolution)  

---

## 1. Summary
During Sprint 1 evaluation, an integration test revealed that authenticated users with role `CUSTOMER` were able to trigger `PATCH /api/v1/admin/users/:id/role` and suspend accounts, violating Acceptance Criteria AC-02 and Non-Functional Requirement NFR-04.

---

## 2. Root Cause Analysis
The route definition in `src/controllers/AdminController.ts` was mounted under `/api/v1/admin` using generic `authenticateToken` middleware, but was missing the role guard middleware `requireRole('ADMIN')`.
Because the controller route lacked explicit role enforcement, any valid JWT token (including those issued to `CUSTOMER` accounts) was accepted.

---

## 3. Environment-First Resolution (Not Ad-Hoc Code Patch)
Following AI-native guidelines ("When an agent fails, fix the environment: spec, hook, rule — not the generated code"):

1. **Created Substrate Hook**:
   Created `.claude/hooks/role-boundary-check.js` to automatically scan all controller files before commits. Any controller route path containing `/admin` without `requireRole('ADMIN')` or equivalent role check immediately aborts tool execution with exit code 2.
2. **Updated Specification**:
   Clarified `specs/user-management_spec.md` with explicit Given-When-Then scenario `Scenario AC-02-B` asserting HTTP 403 Forbidden when non-admin calls role update endpoints.
3. **Codified Architectural Test**:
   Added automated rule in `tests/architecture/layering.spec.ts` asserting that 100% of routes under `/api/v1/admin` reject requests lacking `ADMIN` claim.
4. **Regenerated Code**:
   Instructed `crud-scaffolder-agent` to regenerate `AdminController.ts` adhering to the new guardrail.

---

## 4. Verification & Prevention
- Static check: `node .claude/hooks/role-boundary-check.js` -> PASS
- Security test: `npx vitest run tests/integration/AdminRoleProtection.spec.ts` -> PASS (HTTP 403 confirmed)
- Regressions prevented permanently via the CI pre-commit hook.
