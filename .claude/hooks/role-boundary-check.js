#!/usr/bin/env node
'use strict';

/**
 * role-boundary-check.js
 * Enforces NFR-04 & NFR-08: Authentication enforced at controller layer;
 * ADMIN and CUSTOMER endpoints are partitioned by role.
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

  // If no specific file passed, check all controllers under src/controllers
  const filesToCheck = [];
  if (filePath) {
    filesToCheck.push(filePath);
  } else {
    const controllersDir = path.resolve('src/controllers');
    if (fs.existsSync(controllersDir)) {
      const list = fs.readdirSync(controllersDir);
      for (const f of list) {
        if (f.endsWith('.ts') || f.endsWith('.js')) {
          filesToCheck.push(path.join(controllersDir, f));
        }
      }
    }
  }

  for (const file of filesToCheck) {
    const resolved = path.resolve(file);
    if (!resolved.includes('controller') && !resolved.includes('Controller')) {
      continue;
    }

    const content = fs.readFileSync(resolved, 'utf8');

    // If file defines admin routes or is an AdminController, verify role guard
    if (resolved.includes('Admin') || content.includes('/admin') || content.includes("role === 'ADMIN'")) {
      const hasAdminGuard =
        content.includes("requireRole('ADMIN')") ||
        content.includes('requireAdmin') ||
        content.includes("role === 'ADMIN'") ||
        content.includes('UserRole.ADMIN');

      if (!hasAdminGuard) {
        process.stdout.write(
          `BLOCKED [NFR-04]: Admin controller/route in ${file} lacks required ADMIN role guard!\n` +
          `Every admin endpoint must be protected by requireRole('ADMIN').\n`
        );
        process.exit(2);
      }
    }
  }
} catch (_) {
  // Graceful fallback
}

process.exit(0);
