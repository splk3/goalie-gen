#!/usr/bin/env bash
set -euo pipefail

# Find project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
cd "$PROJECT_ROOT"

WORKFLOW_PATH="${SUPER_LINTER_WORKFLOW_PATH:-.github/workflows/super-linter.yml}"
JOB_NAME="${SUPER_LINTER_WORKFLOW_JOB:-super-lint}"

echo "=== Super-linter runner (precedence: gh act -> Docker -> local) ==="

if command -v gh &>/dev/null && gh act --help >/dev/null 2>&1; then
  echo "Using gh act with workflow: $WORKFLOW_PATH (job: $JOB_NAME)"
  gh act -W "$WORKFLOW_PATH" -j "$JOB_NAME" "$@"
  exit $?
fi

echo "gh act unavailable; checking Docker fallback..."
if command -v docker &>/dev/null && docker info &>/dev/null; then
  "$SCRIPT_DIR/run-super-linter-docker.sh" "$@"
  exit $?
fi

echo "Docker unavailable; using local lint fallback..."
"$SCRIPT_DIR/fix-lint.sh" "$@"
