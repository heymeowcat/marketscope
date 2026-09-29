# MarketScope Agent Roster (AGENTS.md)
## Table of Contents

This document indexes all autonomous agents configured within the MarketScope engineering substrate under `.claude/agents/`.

---

### Core Harness Agents (Foundation)
1. **[planner](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/planner.md)** — BRD generation, feature breakdown, dependency graphs, and sprint planning.
2. **[generator](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/generator.md)** (Implementer) — TDD code generation, test authoring, and agent team coordination.
3. **[evaluator](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/evaluator.md)** (Reviewer) — Application execution, sprint contract verification, and Playwright MCP validation.
4. **[security-reviewer](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/security-reviewer.md)** — OWASP top 10 security audits, credential leak detection, and role boundary checks.
5. **[test-engineer](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/test-engineer.md)** (Tester) — Comprehensive test plans, edge-case generation, and Playwright E2E suites.
6. **[design-critic](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/design-critic.md)** — Multi-criteria heuristic evaluation, UI accessibility, and design review.
7. **[ui-designer](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/ui-designer.md)** — Modern, responsive React component designs and interactive layouts.

---

### Domain-Specific Agents (MarketScope Substrate)
8. **[portfolio-stats-agent](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/portfolio-stats-agent.md)** — Specializes in portfolio valuation, cost-basis computation, fixed-point P&L math, and gainer/loser rankings (AC-09, AC-10, NFR-01).
9. **[order-lifecycle-agent](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/order-lifecycle-agent.md)** — Specializes in trade order state transitions, cash balance sufficiency guards, and append-only trade ledger enforcement (AC-06, AC-07, AC-08, NFR-02).
10. **[user-management-agent](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/user-management-agent.md)** — Specializes in customer onboarding, bcrypt credential hashing, role transitions, and administrative audit logging (AC-01, AC-02, NFR-03, NFR-04).

---

### Technical Substrate Agents
11. **[crud-scaffolder-agent](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/crud-scaffolder-agent.md)** — Generates clean 4-tier modules (controllers, services, repositories, domain) conforming to architecture constraints.
12. **[archtest-author-agent](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/archtest-author-agent.md)** — Authors and enforces structural tests, dependency boundary checks, and immutability assertions (NFR-08).

---

### Operations & Maintenance Agents (Bonus)
13. **[janitor](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/janitor.md)** — Codebase hygiene, dead code removal, dependency auditing, and lint-drift correction.
14. **[performance-auditor](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/performance-auditor.md)** — Startup time verification, N+1 query detection, and sub-second health endpoint guarantees (NFR-07).
15. **[doc-writer](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/agents/doc-writer.md)** — Architecture documentation maintenance, post-mortem recording, and knowledge deposit tracking.
