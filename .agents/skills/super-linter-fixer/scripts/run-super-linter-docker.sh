#!/usr/bin/env bash
set -euo pipefail

# Find project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Running Super-Linter locally via Docker ==="

# Keep this aligned with .github/workflows/super-linter.yml action version (v8.7.0).
SUPER_LINTER_IMAGE="${SUPER_LINTER_IMAGE:-ghcr.io/super-linter/super-linter:slim-v8.7.0}"

# Check if Docker is running
if ! docker info &>/dev/null; then
  echo "Error: Docker daemon is not running. Please start Docker."
  exit 1
fi

# Run the docker container
# Mount the project root to /tmp/lint — this is the super-linter container's expected
# workspace path when running with RUN_LOCAL=true (matches CI behavior).
# Disable Biome linters to avoid conflicts with ESLint and Prettier
# Disable Black to avoid conflict with Ruff (Ruff handles both linting and formatting)
# Exclude generated/agent files from all linters (auto-generated or external content)
docker run --rm \
  -e RUN_LOCAL=true \
  -e USE_FIND_ALGORITHM=true \
  -e VALIDATE_ALL_CODEBASE=true \
  -e LINTER_RULES_PATH=.github/linters \
  -e VALIDATE_JAVASCRIPT_BIOME=false \
  -e VALIDATE_TYPESCRIPT_BIOME=false \
  -e VALIDATE_BIOME_FORMAT=false \
  -e VALIDATE_BIOME_LINT=false \
  -e VALIDATE_PYTHON_BLACK=false \
  -e FILTER_REGEX_EXCLUDE=".*(update-docs-agent\\.lock\\.yml|copilot-setup-steps\\.yml|\\.agents/|\\.github/agents/).*" \
  -v "$(pwd):/tmp/lint" \
  "$SUPER_LINTER_IMAGE"

echo "=== Super-Linter check complete! ==="
