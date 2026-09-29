# Claude Harness Engine Substrate Guidelines (.claude/CLAUDE.md)

## 1. Substrate Architecture
The `.claude/` directory contains the complete Claude Harness Engine runtime configuration, custom agents, enforcement hooks, skills, and state tracking.

## 2. Directory Layout
- `.claude/agents/`: Agent role definitions (system prompts, models, tool permissions).
- `.claude/commands/`: Custom slash commands (`/scaffold`, `/verify-ac`, `/check-role-boundaries`, `/calc-portfolio-pnl`, `/generate-feature`).
- `.claude/hooks/`: PreToolUse, PostToolUse, and TaskCompleted hooks.
- `.claude/skills/`: Procedural knowledge and workflow skills for autonomous subagents.
- `.claude/state/`: Runtime tracking files: `iteration-log.md`, `eval-scores.json`, `learned-rules.md`, `failures.md`.
- `.claude/templates/`: Template contracts and configurations.
- `.claude/settings.json`: Configuration of permissions, enabled plugins, and hook bindings.

## 3. Hook Execution Rules
All hooks are executed via Node.js:
- Hooks must execute in under 5 seconds (unless performing full typecheck/test gates).
- If a hook exits with non-zero code, the tool action is blocked or flagged for remediation.
- The `bigdecimal-financial-check.js` hook prevents float arithmetic on currency.
- The `role-boundary-check.js` hook prevents unprotected admin routes.
- The `executed-order-immutability-check.js` hook blocks mutations to executed orders.

## 4. Sprint Contract Protocol
Before any feature implementation begins:
1. Generator and Evaluator negotiate a sprint contract (`sprint-contracts/sprint-N-contract.json`).
2. Generator implements code and tests following TDD.
3. Evaluator runs the application, executes automated tests, runs Playwright MCP, and computes score.
4. On score >= 85 and 0 security/architecture violations, progress is ratcheted and merged via PR.
