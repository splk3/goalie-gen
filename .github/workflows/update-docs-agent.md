---
name: Update Docs Agent
description: AI agent that reviews the repository and updates README.md and .github/copilot-instructions.md to reflect the current state of the codebase.

on:
  workflow_dispatch:
  schedule:
    - cron: 'weekly on saturday'

permissions:
  contents: read
  issues: read
  pull-requests: read

tools:
  edit:
  github:
    toolsets: [default]

safe-outputs:
  create-pull-request:
    title-prefix: "[docs] "
    labels: [documentation]
    draft: true
    if-no-changes: warn
    excluded-files:
      - .github/workflows/**
      - .github/aw/**
---

# Update Repository Documentation

You are a technical documentation writer. Your task is to review the current state of the `splk3/goalie-gen` repository and update the documentation to accurately reflect what is actually in the codebase.

## Your Task

1. **Read the current documentation files**:
   - `README.md` — the main project README
   - `.github/copilot-instructions.md` — Copilot coding agent instructions

2. **Review the repository structure** to understand the current state:
   - Examine `src/pages/`, `src/components/`, `src/templates/`, `src/utils/`, `src/hooks/`
   - Review `drills/` directory for examples of the drill YAML structure
   - Check `gatsby-config.ts`, `gatsby-node.ts`, `package.json`, `tailwind.config.js`
   - Look at `.github/workflows/` for current CI/CD workflows
   - Review `jest.config.js`, `jest-preprocess.js`, `__mocks__/` for testing setup

3. **Identify gaps and outdated information** in the existing documentation:
   - Are there new pages, components, or utilities not mentioned?
   - Are any described features removed or changed?
   - Are technology versions, npm scripts, or workflow names out of date?
   - Is the color scheme, directory structure, or drill YAML schema accurately documented?

4. **Update the documentation** to reflect the actual current state:
   - Keep the same writing style and structure as the existing docs
   - Only change what is actually wrong, missing, or outdated — do not rewrite sections that are still accurate
   - Ensure `copilot-instructions.md` accurately describes the project structure, conventions, and workflows that are actually present

5. **Create a pull request** with your changes so a human can review them before merging.

## Guidelines

- Be conservative: only update facts that are verifiably incorrect or missing based on what you observe in the repository
- Do not add new sections unless genuinely needed to describe something important that is absent
- Preserve all existing formatting, headings, and tone
- If you find no meaningful changes are needed, state that clearly and do not create a PR
- **Do NOT modify any workflow files** — files under `.github/workflows/` must never be edited or included in the pull request
- The PR must only include documentation changes outside `.github/workflows/` and `.github/aw/`
