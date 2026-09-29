# Scripts & Agent Automation Guidelines (scripts/CLAUDE.md)

## 1. Scope
The `scripts/` directory contains automation tooling, seed data scripts, and programmatic Claude Agent SDK harnesses.

## 2. Inventory
- `scripts/seed.ts`: Seeds database with synthetic market data (demo users, stock symbols, watchlists, trade history).
- `scripts/run_agent_pipeline.py`: Python CLI leveraging the Anthropic Claude Agent SDK to programmatically execute generator and evaluator sprint loops.
- `scripts/agent_sdk_runner.js`: Node.js script leveraging `@anthropic-ai/sdk` for programmatic sprint execution and automated acceptance criteria verification.

## 3. Execution Commands
```bash
# Seed local database with synthetic records
npm run seed

# Run programmatic Agent SDK sprint verification (Node.js)
npm run agent:sprint

# Run programmatic Agent SDK pipeline (Python)
python3 scripts/run_agent_pipeline.py --sprint sprint-contracts/sprint-1-foundation.json
```
