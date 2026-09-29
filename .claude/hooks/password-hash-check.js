#!/usr/bin/env node
'use strict';

/**
 * password-hash-check.js
 * Enforces NFR-03: Passwords stored using strong KDF (bcrypt/argon2); plaintext credentials never logged.
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

  const content = fs.readFileSync(resolved, 'utf8');

  // Check for plaintext password logging patterns
  const logPatterns = [
    /console\.(log|info|debug|warn|error)\(.*password.*\)/i,
    /logger\.(info|debug|warn|error)\(.*password.*:.*req\.body\.password.*\)/i,
  ];

  for (const pattern of logPatterns) {
    if (pattern.test(content)) {
      process.stdout.write(`BLOCKED [NFR-03]: Plaintext password logging detected in ${filePath}!\nNever log plaintext passwords.\n`);
      process.exit(2);
    }
  }

  // Check if auth service or user registration handles password without hashing
  if (resolved.includes('AuthService') || resolved.includes('user') || resolved.includes('auth')) {
    if (content.includes('password') && !content.includes('bcrypt') && !content.includes('argon2') && !content.includes('hash')) {
      process.stdout.write(`WARNING [NFR-03]: Password handling in ${filePath} appears to lack bcrypt/argon2 hashing.\n`);
    }
  }
} catch (_) {
  // Graceful fallback
}

process.exit(0);
