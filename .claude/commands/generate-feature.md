---
name: generate-feature
description: Drives an end-to-end feature generation sprint from specs/<feature>_spec.md through TDD and ratchet evaluation.
---

# /generate-feature — Feature Sprint Execution

Usage: `/generate-feature <feature-name>` (e.g. `/generate-feature watchlist`)

When this command is invoked:
1. Load `specs/<feature-name>_spec.md` and read all Acceptance Criteria.
2. Initialize sprint contract in `sprint-contracts/` with testable requirements.
3. Spawn `generator` (implementer) agent to write failing unit/integration tests tagged with `[AC-NN]`.
4. Implement minimal production code to make all tests green.
5. Execute pre-commit and architectural hooks (`npm run test:arch`, `node .claude/hooks/role-boundary-check.js`, `node .claude/hooks/bigdecimal-financial-check.js`).
6. Run `evaluator` to run app, verify Playwright E2E UI flows, and issue review report.
7. Merge via `git merge --no-ff` upon achieving ratchet threshold score >= 85.
