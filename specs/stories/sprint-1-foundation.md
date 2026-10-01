# Sprint 1: Foundation — User Management & Stock Catalog

## Stories

### Story S01 — Customer Registration (AC-01, NFR-03)
**Layer:** api  
**Owner:** user-management-agent  
**Files:** `src/controllers/auth-controller.ts`, `src/services/auth-service.ts`, `src/repositories/user-repository.ts`, `src/domain/user.ts`, `tests/unit/services/auth-service.spec.ts`, `tests/integration/user-registration.spec.ts`

**Acceptance Criteria:**
- `POST /api/v1/auth/register` with `{ email, password }` creates a user in `ACTIVE` status with `role = CUSTOMER`
- Initial cash balance seeded (configurable, default $50,000)
- Password stored as bcrypt hash (salt rounds ≥ 10) — never in plaintext
- Duplicate email returns 409 with `UserAlreadyExistsException`
- Missing required fields returns 422

**Given-When-Then:**
- **Given** a valid email and password **When** `POST /api/v1/auth/register` **Then** 201 with `{ id, email, role: CUSTOMER, status: ACTIVE }`
- **Given** a duplicate email **When** `POST /api/v1/auth/register` **Then** 409 with error code `USER_ALREADY_EXISTS`
- **Given** valid credentials **When** `POST /api/v1/auth/login` **Then** 200 with signed JWT

---

### Story S02 — Admin Role Management (AC-02, NFR-04)
**Layer:** api  
**Owner:** user-management-agent  
**Files:** `src/controllers/user-admin-controller.ts`, `src/services/user-admin-service.ts`, `src/repositories/audit-log-repository.ts`, `src/domain/audit-log.ts`, `tests/unit/services/user-admin-service.spec.ts`, `tests/integration/user-role-audit.spec.ts`

**Acceptance Criteria:**
- `PUT /api/v1/admin/users/:id/role` with `{ role }` updates user role (ADMIN only)
- Every role change appended to audit log with: `actor_id`, `target_id`, `old_role`, `new_role`, `changed_at` (UTC ISO)
- Non-admin request returns 403
- Changing non-existent user returns 404 with `UserNotFoundException`

---

### Story S03 — Stock Catalog Administration (AC-03)
**Layer:** api  
**Owner:** crud-scaffolder-agent  
**Files:** `src/controllers/stock-admin-controller.ts`, `src/controllers/stock-catalog-controller.ts`, `src/services/stock-catalog-service.ts`, `src/repositories/stock-repository.ts`, `src/domain/stock.ts`, `tests/unit/services/stock-catalog-service.spec.ts`, `tests/integration/stock-catalog-admin.spec.ts`

**Acceptance Criteria:**
- `POST /api/v1/admin/stocks` creates stock (ADMIN only)
- `PUT /api/v1/admin/stocks/:symbol` updates stock details (ADMIN only)
- `DELETE /api/v1/admin/stocks/:symbol` sets `status = DELISTED`, stamps `delisted_at` — NO physical delete
- `GET /api/v1/stocks` returns only ACTIVE stocks with search/filter
- `GET /api/v1/stocks/:symbol` returns stock detail
- **Router paths are RELATIVE to mount point** (`/` and `/:symbol` — never `/stocks`)
