#!/usr/bin/env bash
# executed-order-immutability-check.sh — Shell wrapper for NFR-02 executed order immutability check
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
node "$DIR/executed-order-immutability-check.js" "$@"
