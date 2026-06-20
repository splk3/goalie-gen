# Project Architecture & Tech Stack

This document details the Goalie Gen technology stack, code architecture, directory layout, configurations, and design tokens.

---

## 🛠 Tech Stack

Goalie Gen is built using the following core frameworks and tools:

- **GatsbyJS 5**: A React-based static site generator that compiles the application into static HTML and JS assets.
- **React 19**: Standard JavaScript library for component-based rendering.
- **TypeScript**: Used for all code files (pages, components, utilities, and configuration) to ensure type safety and schema validation.
- **Tailwind CSS 4**: A utility-first CSS framework for modern styling.
- **PDF Generation (jsPDF)**: Lazy-loaded browser-side library to render and export goalie drill sheets.
- **Word Document Generation (docx)**: Client-side library to assemble `.docx` format documents for development plans and journals.
- **Color Extraction (colorthief)**: Client-side library used to extract color swatches from uploaded team logo images.
- **YAML Parsing (js-yaml)**: Reads static YAML content for resource directories and dynamic drill pages.

---

## 🎨 Design System

Goalie Gen utilizes USA national team colors as its default brand design scheme:

- **Blue**: `#00205B` (`usa-blue`) - Used for primary headings, call-to-actions, and main document accents.
- **Red**: `#AF272F` (`usa-red`) - Used for secondary text, alerts, highlights, and borders.
- **White**: `#FFFFFF` (`usa-white`) - Page base and primary background.

Custom configurations allow youth clubs and teams to upload their logo to auto-populate primary and secondary options via the color extraction API.

---

## 📁 Repository Directory Structure

```text
├── src/
│   ├── components/       # Reusable UI components (TypeScript)
│   │   └── __tests__/     # Unit tests for components
│   ├── pages/            # Page components (auto-routed by Gatsby)
│   │   └── __tests__/     # Unit tests for pages
│   ├── templates/        # Page templates for dynamic content
│   │   └── __tests__/     # Unit tests for templates
│   ├── styles/           # Global styles and Tailwind imports
│   ├── hooks/            # Custom React hooks (e.g. filter/search logic)
│   ├── types/            # Shared TypeScript type definitions
│   ├── content/          # Markdown documents for plan and journal templates
│   ├── data/             # YAML static lists (e.g. resource lists)
│   └── utils/            # Shared utility modules
│       └── __tests__/     # Unit tests for utilities
├── drills/               # Active goalie drills database (YAML + images)
├── drill-spec-example/   # Reference spec for creating new goalie drills
├── static/               # Public static assets (icons, PDF resources)
├── __mocks__/            # Jest mocks for Gatsby, modules, and static assets
├── gatsby-config.ts     # Gatsby configuration (plugins, siteMetadata)
├── gatsby-browser.tsx   # Browser-side configurations
├── gatsby-node.ts       # Gatsby Node APIs for dynamic page generation
├── gatsby-ssr.tsx       # Gatsby server-side rendering setup
├── tsconfig.json        # TypeScript configuration
├── wrangler.jsonc       # Cloudflare Pages deployment configuration
├── jest.config.js       # Jest configuration
└── package.json         # Project metadata, scripts, and dependencies
```

---

## 🔧 Repository Configuration

### CODEOWNERS

A `.github/CODEOWNERS` file defines write-ownership for paths. Currently, `@splk3` is default owner for all files.

### Dependabot

Configured via `.github/dependabot.yml` to automatically track and update:

- npm packages (weekly)
- GitHub Actions (weekly)
- Cap of 10 open PRs per ecosystem

### Environment Variables

Environment variables configure development and production target URLs:

- `.env.development`: sets `GATSBY_SITE_URL=https://dev.goaliegen.com`
- `.env.production`: sets `GATSBY_SITE_URL=https://goaliegen.com`
- `.env.example`: template for environment configuration variables
