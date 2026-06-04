# Copilot Instructions for Goalie Gen

## Build, test, and lint commands

- Use Node 24 (`.nvmrc`, `package.json#engines`): `nvm use`
- Install dependencies: `npm install`
- Start dev server: `npm run develop` (alias: `npm start`)
- Production build: `npm run build`
- Serve production build locally: `npm run serve`
- Full unit test suite: `npm test`
- Single test file: `npm test -- src/components/__tests__/Pagination.test.tsx`
- Single test by name: `npm test -- -t "clamps out-of-range currentPage"`
- Type-check: `npx tsc --noEmit`
- Prettier check (matches repo docs): `npx prettier --check "src/**/*.{ts,tsx,js,css}" "*.{ts,js,json,md}" "gatsby-*.{ts,tsx}" ".github/**/*.{yml,yaml,md}" "drills/**/*.yml"`

CI runs:

- `.github/workflows/test-build.yml`: `npm ci` → `npm test` → `npm run build`
- `.github/workflows/super-linter.yml`: super-linter with rules from `.github/linters/`

## MCP servers

- **Playwright MCP** is the most relevant server for this repo. Use it for browser-level checks on
  Gatsby pages (navigation, filters, modal behavior, responsive layouts, and print/download flows)
  before/after UI changes.

## High-level architecture

### 1. Build-time drill ingestion pipeline

`gatsby-node.ts` is the center of the drill system:

- `onPreBootstrap` copies `drills/` into `static/drills/` so drill images are directly servable
- `loadDrillsFromDirectory` parses every `drill.yml` with `yaml.FAILSAFE_SCHEMA`
- `validateDrillData` enforces drill schema and allowed tag values
- `createPages` generates `/drills/{folder}` pages using `src/templates/drill.tsx`
- `sourceNodes` creates GraphQL `Drill` nodes so pages/components can query all drills

`createPages` and `sourceNodes` share a module-level drill cache (`getOrLoadDrills`) to avoid
duplicated filesystem reads in one Gatsby build.

### 2. Drill page + PDF/print flow

`src/templates/drill.tsx` renders from `pageContext.drillData` (not a GraphQL page query), including:

- drill information (`description` + required `drill_steps`)
- optional shooter focus and progression sections
- optional video embed via `videoUtils`
- print/download controls (`DownloadDrillPdfButton`, `generateDrillPdf`)

`src/utils/generateDrillPdf.ts` mirrors template content and has its own pagination/layout logic.
`src/utils/estimateDrillPdfPages.ts` is used during build to warn when drill content likely overflows
one page.

### 3. Plan/journal document generation

The document generators (`GenerateTeamPlanButton`, `GenerateClubPlanButton`, `GoalieJournalButton`)
compose docs from markdown content in `src/content/**`.

- Markdown fragments are parsed by `src/utils/markdownParser.ts`
- DOCX paragraphs are built through `src/utils/docxContent.ts`
- `docx` and `jspdf` are loaded lazily via `src/utils/loadExportModules.ts`

### 4. Shared drill filtering model

`src/hooks/useDrillFilters.ts` is the shared filter engine used by:

- `src/pages/goalie-drills.tsx`
- `src/components/INeedADrillButton.tsx`

The goalie drills page also syncs filter/sort/page state to query params for shareable URLs.

## Key conventions

- Static-hosted architecture only (GitHub Pages + Cloudflare Pages). Do not add runtime server
  dependencies (no Gatsby `getServerData`, no server API routes).
- Drill YAML schema is strict and validated at build time:
  - required: `name`, `drill_steps`, `coaching_focus_points`, `tags`, `drill_creation_date`
  - `coaching_focus_points` supports flat string bullets and one-level section objects
    (`Section Title` -> array of string bullets). Mixed entries are allowed in order.
  - `description` is optional
  - `drill_image` is optional and must be a single filename string when provided (not an array)
  - `drill_progressions` supports up to 8 objects with required
    `progression_name`/`progression_description` and optional `progression_image`
  - `tags.game_situations` is optional and supports:
    `power_play`, `penalty_kill`, `net_front_traffic`, `dump_in`, `stick_handling`
  - `tags.space_required` is **required** (at least one value) and supports:
    `full_ice`, `half_ice`, `single_zone`, `half_zone`, `crease_only`, `flexible`.
    Default to `flexible` when no specific space is needed. It is shown on the drill page after
    "Equipment Needed" but is intentionally excluded from the print/PDF output.
  - video URLs must be HTTPS YouTube or Vimeo formats accepted by the validator
- Because drill YAML uses `yaml.FAILSAFE_SCHEMA`, values containing `:` in progression text should
  be quoted to avoid YAML parsing into non-string structures.
- Use `buildCacheBustedAssetPath()` for static asset URLs and
  `OBJECT_URL_REVOKE_DELAY_MS` when creating object URLs for downloads/previews.
- Prefer reusing shared utilities/hook patterns already in use:
  `useDrillFilters`, `loadExportModules`, `normalizeDrillDescription`, `parseMarkdown`.
- Lint/style conventions enforced by repo config:
  - Prettier: double quotes, semicolons, 2-space indent, trailing commas (es5)
  - TypeScript unused args/vars should be removed or prefixed with `_`
- Local Copilot behavior (VS Code Chat / Copilot CLI):
  - Do not run `git add`, `git commit`, `git push`, or create pull requests unless explicitly requested by the user.
  - Leave all edits unstaged by default.
  - If a commit is explicitly requested, stage only files directly related to the requested task.
- Do not edit generated lock artifacts unless explicitly requested:
  `.github/aw/actions-lock.json`, `.github/workflows/*.lock.yml`.
