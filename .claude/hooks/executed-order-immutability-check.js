#!/usr/bin/env node
'use strict';

/**
 * executed-order-immutability-check.js
 * Enforces NFR-02 & NFR-08: Trade records and executed orders are append-only;
 * no edits or deletes post-execution.
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
  if (!['.ts', '.js', '.sql'].includes(ext)) {
    process.exit(0);
  }

  if (resolved.includes('/hooks/') || resolved.includes('/tests/')) {
    process.exit(0);
  }

  const content = fs.readFileSync(resolved, 'utf8');

  // Check for dangerous mutations against executed orders or trades
  const dangerousPatterns = [
    /DELETE\s+FROM\s+(orders|trades)/i,
    /UPDATE\s+orders\s+SET.*WHERE.*status\s*=\s*['"]EXECUTED['"]/i,
    /db\.(orders|trades)\.delete/i,
    /db\.(orders|trades)\.update.*EXECUTED/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      process.stdout.write(
        `BLOCKED [NFR-02]: Executed order / trade mutation detected in ${filePath}!\n` +
        `Trade records and executed orders must be strictly append-only.\n`
      );
      process.exit(2);
    }
  }
} catch (_) {
  // Graceful fallback
}

process.exit(0);
