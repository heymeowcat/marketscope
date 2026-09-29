#!/usr/bin/env bash
# bigdecimal-financial-check.sh — Shell wrapper for NFR-01 financial precision check
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
node "$DIR/bigdecimal-financial-check.js" "$@"
