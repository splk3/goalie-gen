# Goalie Gen

Goalie Gen (Goaltending Development Plan Generator) makes it easy for youth ice hockey teams and clubs to generate customized goaltending development plans.

## 🎯 Features

- **Individual Development Plans**: Generate personalized goaltending development plans
- **Team Development Plans**: Create development plans for entire goaltending rosters
- **Goalie Journal**: Export printable goalie journals for tracking progress
- **Drill Library**: Access and download various goaltending drills
- **PDF/DOCX Export**: Export plans in multiple formats using jsPDF and docx libraries
- **Dark Mode**: Built-in dark mode toggle for comfortable viewing
- **Responsive Design**: Mobile-friendly interface for on-the-go access

## 🚀 Quick Start

1.  **Install dependencies**

    ```shell
    npm install
    ```

2.  **Start developing**

    ```shell
    npm run develop
    ```

3.  **View the site**

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
- Blue: `#002868` (usa-blue)
- Red: `#BF0A30` (usa-red)
- White: `#FFFFFF` (usa-white)

## 📦 Available Scripts

- `npm run develop` - Start the development server
- `npm run build` - Build the production site
- `npm run serve` - Serve the production build locally
- `npm run clean` - Clean the cache and public directories
- `npm run deploy` - Build and deploy to GitHub Pages

## 📁 Project Structure

```
goalie-gen/
├── src/
│   ├── components/       # React components (TypeScript)
│   │   ├── DarkModeToggle.tsx
│   │   ├── DownloadDrillButton.tsx
│   │   ├── DownloadMaterialButton.tsx
│   │   ├── ExternalLinkButton.tsx
│   │   ├── GenerateClubPlanButton.tsx
│   │   ├── GenerateTeamPlanButton.tsx
│   │   ├── GoalieJournalButton.tsx
│   │   ├── Logo.tsx
│   │   ├── NavigationButton.tsx
│   │   ├── SEO.tsx
│   │   └── TermsPopup.tsx
│   ├── pages/            # Page components (auto-routed by Gatsby)
│   │   ├── club-resources.tsx
│   │   ├── coach-resources.tsx
│   │   ├── goalie-drills.tsx
│   │   ├── goalie-resources.tsx
│   │   ├── index.tsx
│   │   └── team-drills.tsx
│   ├── templates/        # Dynamic page templates
│   │   └── drill.tsx     # Template for individual drill pages
│   ├── styles/           # Global CSS styles
│   └── utils/            # Utility functions
│       └── analytics.ts  # Analytics utilities
├── drills/               # Drill database (YAML + images)
│   ├── power-push-quick-movement-blaze-pods/
│   ├── test-drill-advanced-teams/
│   ├── test-drill-beginner/
│   └── test-drill-intermediate/
├── drills_samples/       # Drill specification examples
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
├── gatsby-config.ts     # Gatsby configuration (TypeScript)
├── gatsby-browser.tsx   # Browser APIs (TypeScript)
├── gatsby-node.ts       # Node APIs for dynamic page generation
├── gatsby-ssr.tsx       # SSR APIs (TypeScript)
├── wrangler.jsonc       # Cloudflare Pages configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── tsconfig.json        # TypeScript configuration
```

## 🧊 Drills

Drill examples live in [drills_samples/](drills_samples/) and the full field specification is in [drills_samples/test-drill-spec/drill.yml](drills_samples/test-drill-spec/drill.yml).

Active drills that appear on the site are in the [drills/](drills/) directory. Each drill gets its own dynamically generated page at `/drills/{drill-folder-name}` via the `gatsby-node.ts` configuration.

To add a new drill for the site, create a new folder under [drills/](drills/) named for the drill (one folder per drill). Each drill folder should include:

- A drill.yml file that contains all applicable fields
- One or more images for the drill

Required fields in drill.yml:

- name
- description
- coaching_points
- images
- tags

All other fields (such as `video`) are optional. For tags, each sub-field is optional, and the allowed values for each tag sub-field are the options listed in the spec file. For media fields, `images` should be an array of image filenames, and `video` should be a single URL string.

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
- **Trigger**: Automatic on push to `main` branch + manual dispatch
- **Purpose**: Builds and deploys the site to GitHub Pages
- **Actions**: Runs `npm ci` and `npm run build`, uploads artifact, and deploys to GitHub Pages
- **Node Version**: 20.x with npm caching enabled
- **Deployment**: Uses actions/deploy-pages@v4 with proper permissions and concurrency control

### 2. Super Linter (`super-linter.yml`)
- **Trigger**: On every push to any branch + weekly on Saturdays at 2:00 AM UTC + manual dispatch
- **Purpose**: Validates code quality across multiple languages and formats
- **Configuration**: Uses super-linter v8 with Biome linters disabled to avoid conflicts
- **Requirement**: All code changes must pass linting before merge

### 3. Test Build (`test-build.yml`)
- **Trigger**: Pull requests, manual triggers, and weekly on Saturdays at 3:00 AM UTC
- **Purpose**: Verifies that the site builds successfully without deploying
- **Actions**: Runs `npm ci` and `npm run build`, then verifies `public/` directory was created
- **Node Version**: 20.x with npm caching enabled

### 4. Release Prep (`release-prep.yml`)
- **Trigger**: Manual workflow dispatch or on release creation (filtered to releases with tags ending in `-alpha`)
- **Purpose**: Automatically creates documentation update issues
- **Actions**: Creates GitHub issue for README and copilot instructions updates

## 🚀 Deployment

This site is deployed to both **GitHub Pages** and **Cloudflare Pages** with custom domain support.

### Automated Deployment

- **GitHub Pages**: Automatically deploys when changes are pushed to the `main` branch using the `.github/workflows/deploy.yml` workflow.
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
