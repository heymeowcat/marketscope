#!/usr/bin/env bash
# password-hash-check.sh — Shell wrapper for NFR-03 password hash check
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
node "$DIR/password-hash-check.js" "$@"
