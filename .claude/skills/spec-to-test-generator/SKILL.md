# Spec to Test Generator Skill

## Purpose
Parses feature specifications in `specs/<feature>_spec.md`, extracts all Acceptance Criteria scenarios (AC-NN) and Given-When-Then blocks, and generates comprehensive, executable Vitest / Jest test suites.

## Generation Procedure

### 1. Spec Extraction
- Reads target specification file.
- Collects:
  - Acceptance Criteria ID (`[AC-01]`, `[AC-02]`, etc.)
  - Scenario titles (e.g. `Scenario AC-08-A`)
  - Given preconditions (initial account cash, existing stock price)
  - When actions (HTTP method, route, request body)
  - Then assertions (HTTP status code, response body, database state changes)

### 2. Test File Scaffolding
- Creates unit tests under `tests/unit/domain/` for pure domain rules.
- Creates integration tests under `tests/integration/` using Supertest against Express app.
- Annotates every `describe` and `it` block with the corresponding `[AC-NN]` tag.
- Includes positive path, boundary cases, and negative error branches.

### 3. Assertion Validation
- Verifies that response assertions check:
  - HTTP status codes (200, 201, 400, 403, 404, 409, 422).
  - Exact JSON error envelope structure (`error`, `message`, `correlationId`).
  - Immutability of database records post-execution.
