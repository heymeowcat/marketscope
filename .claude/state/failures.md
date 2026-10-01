# Failure Log
<!-- Append-only. Used for pattern detection → learned rules extraction. -->
<!-- When 2+ entries share the same Category, extract a Learned Rule to .claude/state/learned-rules.md -->

## Group B — Failure #1 (Sprint 2: Watchlist & Portfolio)
- **Date:** 2026-09-30T03:36:50Z
- **Category:** type_error
- **Story:** AC-04, AC-05, AC-09
- **Attempt 1:**
  - Error: `src/controllers/portfolio-controller.ts:48 — Argument of type 'string | undefined' is not assignable to parameter of type 'string'` (18 TypeScript errors total)
  - Fix: Added null guards `const userId = req.user?.userId; if (!userId) return res.status(401)...` and corrected router paths from `/stocks` to `/`
  - Result: PASS — Compilation clean after fix
- **Pattern:** Controllers extracted `req.user?.userId` without null guard under TypeScript `strict: true`. Router paths duplicated the resource prefix already set in `app.use()` mount.
- **Extracted Rule:** LR-002 (Router relative paths), LR-003 (Auth null guards)

## Group B — Failure #2 (Sprint 2: Watchlist & Portfolio)
- **Date:** 2026-09-30T03:36:50Z
- **Category:** type_error
- **Story:** AC-04, AC-05
- **Attempt 1:**
  - Error: `tests/integration/watchlist-creation.spec.ts — Type '"CUSTOMER"' is not assignable to type 'UserRole'` and `Type '"ACTIVATED"' is not assignable to type 'UserStatus'`
  - Fix: Import `UserRole`, `UserStatus` enums and replace string literals with `UserRole.CUSTOMER`, `UserStatus.ACTIVE`
  - Result: PASS
- **Pattern:** Integration test seeds used raw string literals instead of TypeScript enum values.
- **Extracted Rule:** LR-004 (Canonical entity seeding schema)

## Group B — Failure #3 (Sprint 2: Watchlist & Portfolio)
- **Date:** 2026-09-30T03:36:50Z
- **Category:** import_error
- **Story:** AC-03, AC-04
- **Attempt 1:**
  - Error: `src/domain/stock-soft-delete-rule.ts:1 — Module '"./exceptions"' has no exported member 'HardDeleteNotAllowedException'`
  - Fix: Added `HardDeleteNotAllowedException` export to `src/domain/exceptions.ts`
  - Result: PASS
- **Pattern:** Two agent sub-teams independently extended `exceptions.ts` (shared file) in Sprint 2 and dropped the `HardDeleteNotAllowedException` from Sprint 1 during the merge.
- **Extracted Rule:** Shared file coordination must be explicitly managed via Phase 3 integration step; designate a single integrator for `exceptions.ts`.

## Group E — Failure #4 (E2E CI)
- **Date:** 2026-10-01T09:09:00Z
- **Category:** playwright_fail
- **Story:** NFR-07 (health endpoint)
- **Attempt 1:**
  - Error: `[WebServer] Error: Cannot find module './repositories/stock-repository'` — Playwright webServer crashed because `dist/` was absent (gitignored, never built in CI)
  - Fix: Added `"pretest:e2e": "npm run build"` to `package.json`; added `npm run build` step to CI YAML; added dual `/health` + `/api/health` routes
  - Result: PASS
- **Pattern:** Playwright's `webServer.command: 'npm start'` launches the compiled JS server but `dist/` was never built in CI. Health check URL mismatch (`/health` vs `/api/health`) caused 120s timeout.
- **Extracted Rule:** LR-005 (Playwright E2E build pre-condition and health route alignment)


<!-- When 2+ entries share the same Category, extract a Learned Rule to .claude/state/learned-rules.md -->

<!-- ENTRY FORMAT (copy this for each new failure):

## Group {ID} — Failure #{N}
- **Date:** {ISO 8601}
- **Category:** {lint_format | type_error | test_failure | import_error | coverage_drop | api_check_fail | playwright_fail | design_score_low | docker_fail | architecture_drift}
- **Story:** {story ID}
- **Attempt 1:**
  - Error: {error message with file:line if available}
  - Fix: {what was tried}
  - Result: FAIL — {why it failed}
- **Attempt 2:**
  - Error: {error message}
  - Fix: {what was tried}
  - Result: FAIL — {why it failed}
- **Attempt 3:**
  - Error: {error message}
  - Fix: {what was tried}
  - Result: FAIL — 3 attempts exhausted
- **Escalation:** User notified. Marked BLOCKED. Skipped to next group.
- **Pattern:** {describe the recurring pattern if visible}

-->
