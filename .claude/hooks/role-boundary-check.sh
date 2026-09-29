#!/usr/bin/env bash
# role-boundary-check.sh — Shell wrapper for NFR-04 role boundary check
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
node "$DIR/role-boundary-check.js" "$@"
