#!/usr/bin/env node
'use strict';

/**
 * bigdecimal-financial-check.js
 * Enforces NFR-01: Price, quantity, and P&L values are computed in fixed-point (Decimal.js) — never floating-point.
 */

const fs = require('fs');
const path = require('path');

try {
  let filePath = process.argv[2];
  if (!filePath && !process.stdin.isTTY) {
    try {
      const input = JSON.parse(fs.readFileSync(0, 'utf8'));
      filePath = input.tool_input && input.tool_input.file_path;
    } catch (_) {}
  }

  if (!filePath) {
    process.exit(0);
  }

  const resolved = path.resolve(filePath);
  const ext = path.extname(resolved).toLowerCase();
  if (!['.ts', '.js'].includes(ext)) {
    process.exit(0);
  }

  if (resolved.includes('/hooks/') || resolved.includes('/tests/')) {
    process.exit(0);
  }

  // Focus on financial calculation files
  if (
    resolved.includes('Portfolio') ||
    resolved.includes('pnl') ||
    resolved.includes('Order') ||
    resolved.includes('Valuation') ||
    resolved.includes('Stats')
  ) {
    const content = fs.readFileSync(resolved, 'utf8');

    // Detect naive floating arithmetic on financial keywords
    const floatMathPatterns = [
      /quotePrice\s*[*+-/]\s*quantity/i,
      /currentPrice\s*[*+-/]\s*avgBuyPrice/i,
      /totalInvested\s*[*+-/]\s*currentValue/i,
      /absolutePnl\s*\/\s*totalInvested/i,
    ];

    for (const pattern of floatMathPatterns) {
      if (pattern.test(content) && !content.includes('decimal.js') && !content.includes('Decimal')) {
        process.stdout.write(
          `BLOCKED [NFR-01]: Floating point arithmetic detected in financial module ${filePath}!\n` +
          `All financial calculations must use Decimal.js fixed-point arithmetic (.plus, .minus, .times, .dividedBy).\n`
        );
        process.exit(2);
      }
    }
  }
} catch (_) {
  // Graceful fallback
}

process.exit(0);
