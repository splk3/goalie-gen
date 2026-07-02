#!/usr/bin/env bash
set -euo pipefail

# Find project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Running local linters with .github/linters/ configurations ==="

# 1. Prettier
echo "Running Prettier..."
if [ $# -eq 0 ]; then
  npx prettier --write --config .github/linters/.prettierrc.json --ignore-path .github/linters/.prettierignore "src/**/*.{ts,tsx,js,css}" "*.{ts,js,json,md}" "gatsby-*.{ts,tsx}" ".github/**/*.{yml,yaml,md}" "drills/**/*.yml"
else
  npx prettier --write --config .github/linters/.prettierrc.json --ignore-path .github/linters/.prettierignore "$@"
fi

# 2. ESLint
echo "Running ESLint..."
if [ $# -eq 0 ]; then
  npx -y eslint@9 --fix --config .github/linters/eslint.config.mjs src/ gatsby-*.ts || echo "ESLint returned warnings/errors (local execution might fail due to missing plugins; run ./run-super-linter-docker.sh for full containerized check)"
else
  # Filter only JS/TS files
  FILES=()
  for f in "$@"; do
    if [[ "$f" =~ \.(ts|tsx|js|jsx|mjs)$ ]]; then
      FILES+=("$f")
    fi
  done
  if [ ${#FILES[@]} -gt 0 ]; then
    npx -y eslint@9 --fix --config .github/linters/eslint.config.mjs "${FILES[@]}" || echo "ESLint returned warnings/errors (local execution might fail due to missing plugins; run ./run-super-linter-docker.sh for full containerized check)"
  fi
fi

# 3. Codespell (Python tool — requires `pip install codespell`, not available via npx)
echo "Running Codespell..."
if ! command -v codespell &>/dev/null; then
  echo "Codespell not found in PATH — skipping. Install with: pip install codespell"
elif [ -f ".github/linters/.codespellrc" ]; then
  if [ $# -eq 0 ]; then
    codespell --write-changes --config .github/linters/.codespellrc || echo "Codespell complete"
  else
    codespell --write-changes --config .github/linters/.codespellrc "$@" || echo "Codespell complete"
  fi
fi

# 4. Markdown (best effort local autofix)
echo "Running markdownlint (best effort)..."
npx -y markdownlint-cli@0.49.0 --fix --config .github/linters/.markdown-lint.yml "**/*.md" || \
  echo "markdownlint returned warnings/errors or is unavailable"

# 5. CSS (best effort local autofix)
echo "Running stylelint (best effort)..."
npx -y stylelint@17 --fix --config .github/linters/.stylelintrc.json "src/**/*.css" || \
  echo "stylelint returned warnings/errors or is unavailable"

# 6. YAML (lint check only; yamllint has no fix mode)
echo "Running yamllint (check only)..."
if command -v yamllint &>/dev/null; then
  yamllint -c .github/linters/.yaml-lint.yml .github/workflows .github/linters drills src/data test-drills || \
    echo "yamllint returned warnings/errors"
else
  echo "yamllint not found in PATH — skipping. Install with: pip install yamllint"
fi

echo "=== Local lint fixing complete! ==="
