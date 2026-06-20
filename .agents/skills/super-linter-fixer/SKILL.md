---
name: super-linter-fixer
description: Fix linting errors locally using configuration files in .github/linters/ and verify compliance using the local Docker super-linter container.
---

# Super Linter Fixer Skill

This skill helps autonomous CLI agents detect, auto-format, and fix style or structure violations locally before committing code, ensuring parity with the project's GitHub Action super-linter workflow.

---

## 🛠️ Linter Mappings & Local Invocations

All active lint configurations reside under `.github/linters/`. When fixing issues, use the local CLI equivalents mapped to these custom config files:

| Linting Target | Local Command / Tool | Config File Reference |
|---|---|---|
| **JavaScript / TypeScript** | `npx eslint --fix` | `.github/linters/eslint.config.mjs` |
| **Markdown** | `npx markdownlint-cli --fix` | `.github/linters/.markdown-lint.yml` |
| **YAML** | `yamllint` | `.github/linters/.yamllint.yml` |
| **JSON / CSS / MD** | `npx prettier --write` | `.github/linters/.prettierrc.json` & `.github/linters/.prettierignore` |
| **CSS Styles** | `npx stylelint --fix` | `.github/linters/.stylelintrc.json` |
| **Spelling** | `npx codespell --write-changes` | `.github/linters/.codespellrc` |

---

## 🚀 Skill Workflows

### Workflow 1: Auto-Fixing Local Code Violations
To automatically check and format changed files or the whole project:
1. Run the local formatting script:
   ```bash
   ./.agents/skills/super-linter-fixer/scripts/fix-lint.sh
   ```
2. Verify that your fixes did not introduce syntax or test failures:
   ```bash
   npm test
   npx tsc --noEmit
   ```

### Workflow 2: Verifying Parity via Docker Super-Linter
To run a full CI-parity compliance check locally using the official container image:
1. Ensure the Docker daemon is running.
2. Run the helper script:
   ```bash
   ./.agents/skills/super-linter-fixer/scripts/run-super-linter-docker.sh
   ```
3. This runs the `ghcr.io/super-linter/super-linter` image with the project root mounted to `/tmp/lint` (the super-linter container's expected workspace path for `RUN_LOCAL=true` runs), validating all files using the configs in `.github/linters/`.
