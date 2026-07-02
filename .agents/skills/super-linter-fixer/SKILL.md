---
name: super-linter-fixer
description: Run super-linter via gh act first, then pinned Docker parity, then local linters for fixing and validation.
---

# Super Linter Fixer Skill

This skill helps autonomous CLI agents detect, auto-format, and fix style or structure violations before committing, while prioritizing execution paths that best match CI behavior.

---

## 🛠️ Linter Mappings & Local Invocations

All active lint configurations reside under `.github/linters/`. When falling back to local linting, use the local CLI equivalents mapped to these custom config files:

| Linting Target | Local Command / Tool | Config File Reference |
|---|---|---|
| **JavaScript / TypeScript** | `npx eslint --fix` | `.github/linters/eslint.config.mjs` |
| **Markdown** | `npx markdownlint-cli --fix` | `.github/linters/.markdown-lint.yml` |
| **YAML** | `yamllint` | `.github/linters/.yaml-lint.yml` |
| **JSON / CSS / MD** | `npx prettier --write` | `.github/linters/.prettierrc.json` & `.github/linters/.prettierignore` |
| **CSS Styles** | `npx stylelint --fix` | `.github/linters/.stylelintrc.json` |
| **Spelling** | `npx codespell --write-changes` | `.github/linters/.codespellrc` |

---

## 🚀 Skill Workflows (Precedence)

### Workflow 1: Preferred Entry Point (gh act → Docker → local)
Run:
```bash
./.agents/skills/super-linter-fixer/scripts/run-super-linter.sh
```

This script enforces the default precedence:
1. Use `gh act` with `.github/workflows/super-linter.yml` (default path when available).
2. If `gh act` is unavailable, use Docker with pinned Super-Linter image `ghcr.io/super-linter/super-linter:slim-v8.7.0` (matching the workflow version).
3. If Docker is unavailable, fall back to local linters.

### Workflow 2: Auto-Fixing Local Code Violations
To automatically check and format changed files or the whole project:
1. Run the local lint fixer script:
   ```bash
   ./.agents/skills/super-linter-fixer/scripts/fix-lint.sh
   ```
2. Verify that your fixes did not introduce syntax or test failures:
   ```bash
   npm test
   npx tsc --noEmit
   ```

### Workflow 3: Verifying Parity via Docker Super-Linter
To run a full CI-parity compliance check locally using the official container image:
1. Ensure the Docker daemon is running.
2. Run the helper script:
   ```bash
   ./.agents/skills/super-linter-fixer/scripts/run-super-linter-docker.sh
   ```
3. This runs the pinned `ghcr.io/super-linter/super-linter:slim-v8.7.0` image with the project root mounted to `/tmp/lint` (the super-linter container's expected workspace path for `RUN_LOCAL=true` runs), validating all files using the configs in `.github/linters/`.
