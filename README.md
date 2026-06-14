# Goalie Gen

Goalie Gen (Goaltending Development Plan Generator) makes it easy for youth ice hockey teams and clubs to generate customized goaltending development plans.

## 🎯 Features

- **Individual Development Plans**: Generate personalized goaltending development plans
- **Team Development Plans**: Create development plans for entire goaltending rosters
- **Goalie Journal**: Export printable goalie journals for tracking progress
- **Drill Library**: Access and download various goaltending drills
- **Content Freshness Indicators**: Automatically highlights new and recently updated drills with "New Content!" or "Updated Content!" badges
- **PDF/DOCX Export**: Export plans in multiple formats using jsPDF and docx libraries
- **Dark Mode**: Built-in dark mode toggle for comfortable viewing
- **Responsive Design**: Mobile-friendly interface for on-the-go access

## 🚀 Quick Start

1. **Install dependencies**

   ```shell
   npm install
   ```

2. **Start developing**

   ```shell
   npm run develop
   ```

3. **View the site**

   Your site is now running at `http://localhost:8000`!

## 🛠 Tech Stack

- **GatsbyJS 5** - React-based static site generator
- **TypeScript** - Strongly typed programming language that builds on JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **React 19** - JavaScript library for building user interfaces
- **PDF/Document Generation** - jsPDF and docx libraries for exporting development plans
- **YAML Parsing** - js-yaml for drill definitions

## 🎨 Design

The site uses USA national colors:

- Blue: `#00205B` (usa-blue)
- Red: `#AF272F` (usa-red)
- White: `#FFFFFF` (usa-white)

## 📦 Available Scripts

- `npm run develop` - Start the development server
- `npm run build` - Build the production site
- `npm run serve` - Serve the production build locally
- `npm run clean` - Clean the cache and public directories
- `npm run deploy` - Build and deploy to GitHub Pages
- `npm test` - Run unit tests with Jest
- `npm run verify-drills` - Run fixture-based PDF pagination estimate checks

## 🧾 PDF Pagination and Layout Notes

`src/utils/generateDrillPdf.ts`, `src/utils/estimateDrillPdfPages.ts`, and
`src/utils/drillPdfPaginationShared.ts` work together and should be updated as a set.

### Main layout flow

1. Page 1 starts with a dynamic header, tags, and a compact-fit probe.
2. The renderer prefers a full-width first-page diagram layout when content fits.
3. If that probe overflows, it falls back to a two-column first-page layout.
4. Coaching/Shooter/Skills/Video sections flow with page-break checks against the footer-safe limit.

### Progression pagination flow

1. `shouldPlaceProgressionsOnSecondPage()` decides whether progressions move off inline flow.
2. Dedicated progression pages use two columns and a shared card planner (`planDedicatedProgressionCards`).
3. Cards first try preferred layouts (with images), then compact layouts (text-only) if needed.
4. Progression section pages are capped by `PROGRESSION_SECTION_MAX_PAGES`; overflow is logged.

### Tuning guidance

- If you change constants affecting spacing, update both generator and estimator constants.
- Re-run:
  - `npm test -- src/utils/__tests__/estimateDrillPdfPages.test.ts`
  - `npm test -- src/utils/__tests__/generateDrillPdf.test.ts`
  - `npm run verify-drills`
- Keep `generateDrillPdf` draw traces stable unless the layout change is intentional.

## 📁 Project Structure

```text
├── src/
│   ├── components/       # React components (TypeScript)
│   │   ├── BackLinkButton.tsx
│   │   ├── DarkModeToggle.tsx
│   │   ├── DownloadDrillPdfButton.tsx
│   │   ├── DownloadMaterialButton.tsx
│   │   ├── ExternalLinkButton.tsx
│   │   ├── FeedbackButton.tsx
│   │   ├── FormatSelector.tsx
│   │   ├── GenerateClubPlanButton.tsx
│   │   ├── GenerateTeamPlanButton.tsx
│   │   ├── GoalieJournalButton.tsx
│   │   ├── HamburgerMenu.tsx
│   │   ├── INeedADrillButton.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── Logo.tsx
│   │   ├── Modal.tsx
│   │   ├── NavigationButton.tsx
│   │   ├── PageLayout.tsx
│   │   ├── Pagination.tsx
│   │   ├── ResourceList.tsx
│   │   ├── SEO.tsx
│   │   ├── ShareButton.tsx
│   │   ├── TermsPopup.tsx
│   │   ├── UsaHockeyGoldBanner.tsx
│   │   └── __tests__/     # Unit tests for components
│   ├── pages/            # Page components (auto-routed by Gatsby)
│   │   ├── 404.tsx
│   │   ├── club-resources.tsx
│   │   ├── coach-resources.tsx
│   │   ├── goalie-drills.tsx
│   │   ├── goalie-evals.tsx
│   │   ├── goalie-resources.tsx
│   │   ├── index.tsx
│   │   └── team-drills.tsx
│   ├── templates/        # Dynamic page templates
│   │   └── drill.tsx     # Template for individual drill pages
│   ├── styles/           # Global CSS styles
│   ├── hooks/            # Custom React hooks
│   │   ├── useDrillFilters.ts
│   │   └── __tests__/     # Unit tests for hooks
│   ├── types/            # TypeScript type definitions
│   │   ├── drill.ts      # DrillData interface
│   │   └── resources.ts  # ResourceListData & ResourceItem interfaces
│   ├── declarations.d.ts # Module declarations (e.g., CSS modules)
│   ├── content/          # Markdown content for plan and journal generation
│   │   ├── club-plan/    # Club development plan sections
│   │   ├── goalie-journal/ # Goalie journal sections
│   │   └── team-plan/    # Team development plan sections
│   ├── data/             # YAML lists for resources pages
│   │   ├── club-resources-list.yml
│   │   ├── coach-resources-list.yml
│   │   └── goalie-resources-list.yml
│   └── utils/            # Utility functions
│       ├── analytics.ts
│       ├── coachingFocusPoints.ts
│       ├── docxContent.ts
│       ├── docxImageType.ts
│       ├── drillPdfPaginationShared.ts
│       ├── estimateDrillPdfPages.ts
│       ├── generateDrillPdf.ts
│       ├── loadExportModules.ts
│       ├── markdownParser.ts
│       ├── normalizeDrillDescription.ts
│       ├── staticAsset.ts
│       ├── videoUtils.ts
│       └── __tests__/     # Unit tests for utilities
├── drills/               # Drill database (YAML + images)
│   ├── beat-the-pass/
│   ├── butterfly-map-series/
│   ├── crease-footwork/
│   ├── reaction-shot-read/
│   ├── read-and-react/
│   ├── rim-and-shot/
│   ├── rim-stop-cut-across/
│   ├── rvh-low-to-high-release/
│   ├── shot-rebound-recovery/
│   └── two-shot/
├── drill-spec-example/   # Drill specification example
├── static/               # Static assets
│   ├── CNAME            # Custom domain configuration
│   ├── favicons/        # Site icons
│   │   ├── android-chrome-192x192.png
│   │   ├── android-chrome-512x512.png
│   │   ├── apple-touch-icon.png
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── favicon.ico
│   │   └── site.webmanifest
│   ├── images/          # Static images
│   │   ├── logos/       # Site logos (light/dark variants)
│   │   └── usahockey/   # USA Hockey resources
│   └── pdfs/            # PDF resources
│       ├── coach-z-zone-map.pdf
│       ├── goalie-evaluation-form.pdf
│       └── goalie-single-game-review.pdf
├── __mocks__/            # Jest mocks (Gatsby, static assets)
├── gatsby-config.ts     # Gatsby configuration (TypeScript)
├── gatsby-browser.tsx   # Browser APIs (TypeScript)
├── gatsby-node.ts       # Node APIs for dynamic page generation
├── gatsby-ssr.tsx       # SSR APIs (TypeScript)
├── jest.config.js       # Jest test configuration
├── jest-preprocess.js   # Babel/TypeScript transformer for Jest
├── jest.setup.js        # Jest setup (testing-library/jest-dom, Gatsby mock)
├── loadershim.js        # Gatsby loader mock (global.___loader) for Jest
├── wrangler.jsonc       # Cloudflare Pages configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── tsconfig.json        # TypeScript configuration
```

## 🧊 Drills

Drill examples live in [drill-spec-example/](drill-spec-example/) and the full field specification is in [drill-spec-example/drill.yml](drill-spec-example/drill.yml).

Active drills that appear on the site are in the [drills/](drills/) directory. Each drill gets its own dynamically generated page at `/drills/{drill-folder-name}` via the `gatsby-node.ts` configuration.

To add a new drill for the site, create a new folder under [drills/](drills/) named for the drill (one folder per drill). Each drill folder should include:

- A drill.yml file that contains all applicable fields
- Any referenced drill or progression images when diagrams are available

Required fields in drill.yml:

- `name`
- `drill_steps`
- `coaching_focus_points`
- `tags`
- `drill_creation_date`

`drill_creation_date` is required and must be a string in `YYYY-MM-DD` format (for example, `2024-01-15`).
When present, `drill_updated_date` must use the same `YYYY-MM-DD` format.
All other fields are optional. Known optional fields include:

- `description` — optional markdown string shown above drill steps
- `shooter_focus_points` — optional markdown string shown in the shooter focus section
- `drill_image` — optional main drill diagram filename
- `video` — a YouTube or Vimeo URL (see format details below)
- `drill_updated_date` — string in `YYYY-MM-DD` format; must not be earlier than `drill_creation_date`.
- `drill_progressions` — array of up to 8 progression objects. Each progression object requires:
  - `progression_name` (markdown string)
  - `progression_description` (markdown string)
  - `progression_image` (optional string filename)

Drill text fields use markdown strings:

- `drill_steps` should be authored as a markdown list.
  - Ordered (`1.`) and unordered (`-`, `*`) list styles are preserved.
  - Nested lists are supported up to 3 levels deep.
- `coaching_focus_points` and `shooter_focus_points` should be authored as markdown bullets/lists (ordered and nested lists are supported up to 3 levels).
- `description` and progression text fields render markdown paragraphs/lists.

The `tags` field is required. Most sub-fields are optional and accept an **array** of
values from an allowed list and are validated during build time (in `gatsby-node.ts`).
The exceptions are `team_drill`, which is a single string value (`yes` or `no`), and
`space_required`, which is required and must contain at least one value:

- `fundamental_skill`: Allowed values are:
  - `skating`
  - `positioning`
  - `stance`
  - `save_selection`
  - `rebound_control`
  - `recovery`
- `skating_skill`: Allowed values are:
  - `butterfly`
  - `power_push`
  - `shuffle`
  - `t_push`
  - `c_cut`
- `age_level`: Allowed values are:
  - `10U_below`
  - `12U`
  - `14U`
  - `16U_and_older`
  - `all`
- `skill_level`: Allowed values are:
  - `beginner`
  - `intermediate`
  - `advanced`
- `equipment`: Allowed values are:
  - `blaze_pods`
  - `bumpers`
  - `cones`
  - `ice_marker`
  - `none`

- `space_required`: **Required.** At least one value must be selected. Use `flexible` when the drill
  does not require a specific amount of space. Allowed values are:
  - `full_ice`
  - `half_ice`
  - `whole_zone`
  - `half_zone`
  - `crease_only`
  - `flexible`

- `team_drill`: A single string value, either:
  - `yes`
  - `no`

- `game_situations`: Optional (for team and non-team drills). Allowed values are:
  - `power_play`
  - `penalty_kill`
  - `net_front_traffic`
  - `dump_in`
  - `stick_handling`
  - `odd_man_rush`
  - `macro_game`
  - `small_sided_game`
  - `small_unit_play`
  - `opposed_practice`
  - `unopposed_practice`

For media fields, `drill_image` should be a single image filename string when provided, and `video` should be a single URL string pointing to a **YouTube** or **Vimeo** video. The following URL formats are accepted:

- **YouTube**: `https://www.youtube.com/watch?v=VIDEO_ID` (with `v` as the first query parameter) or `https://youtu.be/VIDEO_ID`
- **Vimeo**: `https://vimeo.com/VIDEO_ID`

The build will fail if a `video` field contains a URL from any other domain or in an unrecognized format.
If the source diagram is a PDF, capture and save a screenshot of the rink/drill diagram, then use that screenshot filename as `drill_image` (do not use a PDF file as `drill_image`).

Because drill YAML is parsed with `yaml.FAILSAFE_SCHEMA`, any list item text containing `:` should be quoted so it stays a string (especially in progression/shooter/coaching text lists).

### How Drill Pages Are Generated

Drill pages are automatically created at build time by `gatsby-node.ts`:

1. The `createPages` API reads all drill folders from the `drills/` directory
2. Each drill's `drill.yml` file is parsed and validated
3. A page is created at `/drills/{folder-name}` using the `src/templates/drill.tsx` template
4. Drill data is also added to Gatsby's GraphQL layer via the `sourceNodes` API for querying

## 🔧 TypeScript Support

This project is fully TypeScript-enabled:

- All Gatsby configuration files use TypeScript (`.ts` extensions)
- All components and pages use TypeScript/TSX (`.tsx` extensions)
- Type definitions included for all dependencies
- TypeScript compilation handled automatically by Gatsby

## 🔄 GitHub Actions Workflows

This repository uses GitHub Actions for automation and CI/CD:

### 1. Deploy to GitHub Pages (`deploy.yml`)

- **Trigger**: Automatic on push to `dev` branch + manual dispatch
- **Purpose**: Builds and deploys the site to GitHub Pages
- **Actions**: Runs `npm ci` and `npm run build`, uploads artifact, and deploys to GitHub Pages
- **Node Version**: 24.x with npm caching enabled
- **Deployment**: Uses actions/deploy-pages@v5 with proper permissions and concurrency control

### 2. Super Linter (`super-linter.yml`)

- **Trigger**: On every push to any branch + weekly on Saturdays at 2:00 AM UTC + manual dispatch
- **Purpose**: Validates code quality across multiple languages and formats
- **Configuration**: Uses super-linter v8 with Biome linters disabled to avoid conflicts
- **Requirement**: All code changes must pass linting before merge

### 3. Test Build (`test-build.yml`)

- **Trigger**: Pull requests, manual triggers, and weekly on Saturdays at 3:00 AM UTC
- **Purpose**: Verifies that the site builds successfully without deploying
- **Actions**: Runs `npm ci`, runs unit tests with `npm test`, and then runs `npm run build` to verify the full validation process, then verifies `public/` directory was created
- **Node Version**: 24.x with npm caching enabled

### 4. Update Docs Agent (`update-docs-agent.lock.yml`)

- **Trigger**: Weekly schedule + manual dispatch
- **Purpose**: Runs an AI docs-maintenance workflow that reviews repository state and proposes documentation updates
- **Scope Guardrails**: Pull requests from this workflow must not modify `.github/workflows/` or `.github/aw/`

### 5. Copilot Setup Steps (`copilot-setup-steps.yml`)

- **Trigger**: Manual dispatch + push changes to the workflow file itself
- **Purpose**: Configures the environment for GitHub Copilot Agent by installing the `gh-aw` MCP server extension
- **Job**: `copilot-setup-steps` (recognized by GitHub Copilot Agent)

## 🚀 Deployment

This site is deployed to both **GitHub Pages** and **Cloudflare Pages** with custom domain support.

### Automated Deployment

- **GitHub Pages**: Automatically deploys when changes are pushed to the `dev` branch using the `.github/workflows/deploy.yml` workflow.
- **Cloudflare Pages**: Automatically deploys on push to `main` branch via Cloudflare's Git integration. Configuration is in `wrangler.jsonc`.

### Custom Domains

The site is configured to support both development and production custom domains:

- **Development**: `https://dev.goaliegen.com` (set in `.env.development`, deployed to GitHub Pages)
- **Production**: `https://goaliegen.com` (set in `.env.production`, deployed to Cloudflare Pages)

The custom domain for GitHub Pages is configured via the `static/CNAME` file (currently set to `dev.goaliegen.com`).

### Manual Deployment

To manually build and deploy:

```shell
npm run deploy
```

This command builds the site and pushes the `public/` directory to the `gh-pages` branch.

### Environment Configuration

- The `GATSBY_SITE_URL` environment variable sets the site URL for SEO and metadata
- Development builds use `.env.development` automatically
- Production builds use `.env.production` when `NODE_ENV=production`
- Custom domain is set in `static/CNAME` file

## 🔧 Repository Configuration

### CODEOWNERS

The repository uses a `.github/CODEOWNERS` file to define code ownership. Currently, `@splk3` is the default owner for all files.

### Dependabot

Dependabot is configured via `.github/dependabot.yml` to automatically check for:

- npm package updates (weekly)
- GitHub Actions updates (weekly)
- Maximum of 10 open pull requests per ecosystem

### Environment Variables

- `.env.development`: Development environment configuration (e.g., `GATSBY_SITE_URL=https://dev.goaliegen.com`)
- `.env.production`: Production environment configuration (e.g., `GATSBY_SITE_URL=https://goaliegen.com`)
- `.env.example`: Template for environment variables

## 🤝 Contributing

This is a Gatsby/React project with TypeScript. When contributing:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes (ensure TypeScript and Tailwind CSS conventions are followed)
4. Test locally with `npm run develop` and `npm run build`
5. Commit your changes with clear messages
6. Push to your branch
7. Open a Pull Request

For detailed development guidelines, see `.github/copilot-instructions.md`.

## 📝 License

This project is licensed under the BSD-3-Clause License. See the [LICENSE](LICENSE) file for details.
