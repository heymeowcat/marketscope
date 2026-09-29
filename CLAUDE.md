# MarketScope — AI-Native Stock Trading & Portfolio Analytics Platform
## Root CLAUDE.md

> **Business Case:** BC-AINE-006 · FinTech — Capital Markets / Retail Brokerage  
> **Platform Version:** 1.0.0  
> **Harness Engine:** Claude Harness Engine v1 (Karpathy Ratcheting + Generator-Evaluator Loop)

---

## 1. Operating Rules (AI-Native Engineering Paradigm)

1. **Zero Manual Production Code**: All production code, tests, and database migrations are generated autonomously by Claude Code agents. Hand edits are restricted to specifications, `CLAUDE.md` files, agent prompts, hooks, and skills.
2. **Specification Is Truth**: When code and specifications disagree, the specification wins. Update the specification deliberately and regenerate code — never modify code to bypass a spec requirement.
3. **PR-Driven Workflow**: No direct commits to `main`. All code changes flow through agent-reviewed pull requests using `git merge --no-ff` to preserve PR history.
4. **Synthetic Data Only**: Use strictly dummy data. No confidential or real brokerage data.
5. **Environment-First Resolution**: When an agent encounters failures, fix the environment (specifications, hooks, rules, types) rather than patching generated code ad-hoc.

---

## 2. Technology Stack & Directory Structure

- **Backend**: Node.js + Express / TypeScript
- **Frontend**: React + Vite + TypeScript (responsive desktop & mobile layouts)
- **Financial Precision**: `decimal.js` (Fixed-point arithmetic mandatory — NFR-01)
- **Database**: SQLite (in-memory / file-based) with append-only migration tracking
- **Testing**: Vitest / Jest (Unit & Integration), Playwright (E2E & UI validation)
- **Architecture Validation**: `dependency-cruiser`
- **MCP Server**: Playwright MCP (`.mcp.json`)

```
.
├── .claude/                     # Claude Harness Engine substrate
│   ├── .claude-plugin/          # Plugin manifest
│   ├── agents/                  # Base + Project domain & technical agents
│   ├── commands/                # Custom slash commands
│   ├── hooks/                   # Pre/Post-tool enforcement hooks
│   ├── skills/                  # Autonomous developer skills
│   ├── state/                   # Evaluation state, logs, learned rules
│   └── templates/               # Sprint contracts, compose templates
├── docs/                        # Architecture, business case, TDD, post-mortems
├── plugin.json                  # Root plugin manifest packaging MarketScope substrate
├── .mcp.json                    # MCP server configuration (Playwright MCP)
├── package.json                 # Build, test, and dependency declarations
├── playwright.config.ts         # Playwright E2E configuration
├── .dependency-cruiser.js       # Architecture layering rules
├── specs/                       # Root spec and per-feature specifications
├── sprint-contracts/            # Negotiated sprint contracts
├── src/                         # Application source code
│   ├── controllers/             # REST API controllers & route handlers
│   ├── domain/                  # Pure business rules, invariants, exceptions
│   ├── repositories/            # Append-only persistence & queries
│   └── services/                # Application services & transactional orchestration
├── frontend/                    # React + Vite responsive UI
├── tests/                       # Unit, integration, architecture, E2E tests
│   ├── architecture/            # Structural & layering tests
│   ├── e2e/                     # Playwright user journey tests
│   ├── integration/             # AC-tagged integration tests
│   └── unit/                    # AC-tagged unit tests
└── scripts/                     # Seed runners & programmatic Claude Agent SDK
```

---

## 3. Karpathy Coding Principles

Every agent and human operator must adhere to these four core principles:

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, verify against `specs/`.
- Never guess business logic or domain boundaries.
- Push back on speculative abstractions or unneeded complexity.

### 2. Simplicity First
- Implement the minimum code that satisfies the acceptance criteria.
- No speculative features, single-use utility wrappers, or premature generalisation.
- Clean, readable TypeScript with explicit types.

### 3. Surgical Changes
- Modify only what the prompt or feature spec requires.
- Maintain existing style conventions in the file being touched.
- Never rewrite surrounding code or comments unnecessarily.

### 4. Goal-Driven Execution
- Convert acceptance criteria (AC-01 through AC-10) into executable, failing tests before implementing code (TDD).
- Verify every change against test suites and architectural rules before proposing a merge.

---

## 4. Key Verification & Build Commands

```bash
# Install dependencies
npm install

# Run database seed (synthetic users, catalog, watchlists, orders)
npm run seed

# Start development servers (Backend + Frontend)
npm start

# Run all test suites with coverage report
npm run test:coverage

# Run architecture layering tests (dependency-cruiser)
npm run test:arch

# Run Playwright E2E UI verification
npm run test:e2e

# Run all quality gates in sequence
npm run verify
```

---

## 5. Layered CLAUDE.md Navigation

- [specs/CLAUDE.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/specs/CLAUDE.md) — Specification authoring & AC traceability guidelines
- [.claude/CLAUDE.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/.claude/CLAUDE.md) — Agent roles, hooks execution, and sprint contracts
- [src/CLAUDE.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/src/CLAUDE.md) — Source code architecture & layering rules
- [src/controllers/CLAUDE.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/src/controllers/CLAUDE.md) — Controller & API routing conventions
- [src/services/CLAUDE.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/src/services/CLAUDE.md) — Service layer & transaction rules
- [src/domain/CLAUDE.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/src/domain/CLAUDE.md) — Pure domain logic & fixed-point math
- [src/repositories/CLAUDE.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/src/repositories/CLAUDE.md) — Append-only persistence & soft-delete rules
- [frontend/CLAUDE.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/frontend/CLAUDE.md) — UI design, responsive layouts & component patterns
- [tests/CLAUDE.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/tests/CLAUDE.md) — TDD rules, AC tagging & coverage floors
- [scripts/CLAUDE.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/scripts/CLAUDE.md) — CLI tools, seed data, and Claude Agent SDK runner
- [AGENTS.md](file:///Users/vidurafernando/Documents/claudeharnes/helio-sdlc-harness/AGENTS.md) — Table of Contents for all autonomous agents
