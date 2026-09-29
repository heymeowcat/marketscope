# MarketScope — User Management Specification
## Feature Specification (specs/user-management_spec.md)
**Feature Area:** User Onboarding, Authentication, and Role Administration  
**Enforces Criteria:** AC-01, AC-02, NFR-03, NFR-04  

---

## 1. Overview
The User Management module provides secure account registration, credential management, role-based authorization (CUSTOMER, ADMIN, SUSPENDED), and audit logging of administrative changes.

---

## 2. Acceptance Criteria

### AC-01: Customer Registration & Activation
Customer can register with email and password; the new account is created in `ACTIVE` state with `role = CUSTOMER`.

#### Given-When-Then Scenarios:
- **Scenario AC-01-A (Valid Registration):**
  - **Given** an unregistered email `customer@example.com` and a strong password `SecurePassword123!`
  - **When** the registration endpoint `POST /api/v1/auth/register` is invoked
  - **Then** a new user record is created in the database
  - **And** the user `status` is set to `ACTIVE`
  - **And** the user `role` is set to `CUSTOMER`
  - **And** the password hash is computed using bcrypt with salt rounds >= 10 (NFR-03)
  - **And** an initial cash balance of $100,000.00 is credited in fixed-point decimal
  - **And** an HTTP 201 Created response is returned with JWT session token and user profile (excluding password).

- **Scenario AC-01-B (Duplicate Email Rejection):**
  - **Given** an existing registered user with email `existing@example.com`
  - **When** a registration request is submitted with `existing@example.com`
  - **Then** the request is rejected with HTTP 409 Conflict
  - **And** error code `EMAIL_ALREADY_EXISTS` is returned.

---

### AC-02: Role Updates & Audit Logging
Admin can update a user's role (`CUSTOMER` / `ADMIN` / `SUSPENDED`); the action is audited with actor and timestamp.

#### Given-When-Then Scenarios:
- **Scenario AC-02-A (Admin Updates Role):**
  - **Given** an authenticated user with `role = ADMIN`
  - **And** a target user with ID `user-123` whose current role is `CUSTOMER`
  - **When** `PATCH /api/v1/admin/users/user-123/role` is invoked with `{"role": "SUSPENDED", "reason": "Compliance review"}`
  - **Then** the target user's role is updated to `SUSPENDED`
  - **And** an audit log entry is persisted containing:
    - `audit_id`: UUID
    - `target_user_id`: `user-123`
    - `previous_role`: `CUSTOMER`
    - `new_role`: `SUSPENDED`
    - `actor_user_id`: ID of the requesting Admin
    - `timestamp`: UTC ISO-8601 server timestamp
    - `reason`: "Compliance review"
  - **And** an HTTP 200 OK response is returned.

- **Scenario AC-02-B (Non-Admin Role Update Rejected - NFR-04):**
  - **Given** an authenticated user with `role = CUSTOMER`
  - **When** the customer attempts to call `PATCH /api/v1/admin/users/user-123/role`
  - **Then** the request is blocked with HTTP 403 Forbidden
  - **And** no role change or audit record is created.

---

## 3. Non-Functional Security Requirements

### NFR-03: Password Storage & Logging Protections
- Passwords must be hashed using `bcrypt` (work factor 10+) or `argon2id`.
- Plaintext passwords must NEVER appear in application logs, database columns, or error responses.
- Enforced by automated hook `password-hash-check.js`.

### NFR-04: Role Partitioning at Controller Layer
- Endpoints under `/api/v1/admin/*` must strictly require `role = ADMIN`.
- Endpoints under `/api/v1/customer/*` must require `role = CUSTOMER` or `ADMIN`, and reject `SUSPENDED`.
- Suspended accounts cannot execute orders, modify watchlists, or login.

---

## 4. API Specification

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new customer account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user, return JWT |
| `GET` | `/api/v1/auth/me` | Authenticated | Return profile of current user |
| `GET` | `/api/v1/admin/users` | `ADMIN` | List all users with pagination and status |
| `PATCH` | `/api/v1/admin/users/:id/role` | `ADMIN` | Update user role (audited) |
| `GET` | `/api/v1/admin/audit-logs` | `ADMIN` | Retrieve system audit logs |

---

## 5. Test Tagging Matrix
- `[AC-01]`: `tests/unit/services/AuthService.spec.ts`, `tests/integration/UserRegistration.spec.ts`
- `[AC-02]`: `tests/unit/services/UserAdminService.spec.ts`, `tests/integration/UserRoleAudit.spec.ts`
- `[NFR-03]`: `tests/security/PasswordSecurity.spec.ts`
- `[NFR-04]`: `tests/architecture/RoleBoundary.spec.ts`, `tests/integration/AdminRoleProtection.spec.ts`
