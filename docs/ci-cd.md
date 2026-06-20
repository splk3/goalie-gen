# CI/CD and Deployments

Goalie Gen utilizes GitHub Actions and cloud deployment platforms for continuous integration, automated linting/testing, and static site hosting. This document details the CI workflows and deployment configurations.

---

## 🔄 GitHub Actions Workflows

All workflows are configured in `.github/workflows/`.

| Workflow                   | File                         | Trigger                                                                 | Purpose                                                                                                               |
| -------------------------- | ---------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Deploy to GitHub Pages** | `deploy.yml`                 | Push to `dev` branch or manual dispatch                                 | Automatically builds and deploys the site to GitHub Pages.                                                            |
| **Test Build**             | `test-build.yml`             | PRs to any branch, manual triggers, or weekly Saturdays at 3:00 AM UTC  | Runs full Jest test suites, verifies Gatsby builds, and asserts that compilation succeeds.                            |
| **Lint Codebase**          | `super-linter.yml`           | Push to any branch, weekly Saturdays at 2:00 AM UTC, or manual dispatch | Validates quality using formatting checkers. Biome linters are disabled to prevent conflicts.                         |
| **Update Docs Agent**      | `update-docs-agent.lock.yml` | Weekly schedule or manual dispatch                                      | Runs an AI docs-maintenance workflow. Pull requests from this workflow are forbidden from modifying GitHub workflows. |
| **Copilot Setup Steps**    | `copilot-setup-steps.yml`    | Manual dispatch or edits to this workflow file                          | Integrates environment dependencies for GitHub Copilot Agent setup processes.                                         |

---

## 🚀 Deployment Targets & Configurations

Goalie Gen is deployed to two separate environments depending on the branch:

### 1. Development (GitHub Pages)

- **Deployment URL**: `https://dev.goaliegen.com`
- **Trigger**: Automatic on commits to the `dev` branch via the `deploy.yml` GitHub action.
- **Custom Domain Configuration**: Handled via the custom CNAME asset located at `static/CNAME`.
- **Manual Build & Deploy Command**:

  ```bash
  npm run deploy
  ```

  _(Runs Gatsby build and pushes the `public/` directory to the `gh-pages` branch)._

### 2. Production (Cloudflare Pages)

- **Deployment URL**: `https://goaliegen.com`
- **Trigger**: Automatic on commits/merges to the `main` branch via Cloudflare's direct Git integration.
- **Configuration**: Deployment variables and routes are configured in `wrangler.jsonc`.
