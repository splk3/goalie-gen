# Copilot Instructions for Goalie Gen

## Project Overview

This repository hosts a **GatsbyJS-based GitHub Pages website** designed to help youth ice hockey teams and clubs generate customized goaltending development plans.

**Note**: This is a Gatsby project (not Jekyll). The `.gitignore` is configured for Gatsby with entries for `public/`, `.cache/`, and `node_modules/`.

## Technology Stack

- **Static Site Generator**: GatsbyJS 5
- **Hosting**: GitHub Pages with custom domain (dev.goaliegen.com / goaliegen.com)
- **Language**: TypeScript (all config files and components use .ts/.tsx)
- **Framework**: React 18
- **Styling**: Tailwind CSS 4 (utility-first CSS framework)
- **Build Tool**: Gatsby with PostCSS
- **Package Manager**: npm
- **Document Generation**: jsPDF and docx libraries

## Repository Structure

### Source Files (Committed to Git)

The following files and directories are part of the repository:

- `src/`: Source code directory
  - `src/pages/`: Page components (auto-routed by Gatsby) - TypeScript (.tsx)
  - `src/components/`: Reusable React components (TypeScript .tsx files)
    - Logo.tsx, SEO.tsx, DarkModeToggle.tsx
    - GeneratePlanButton.tsx, GenerateTeamPlanButton.tsx
    - GoalieJournalButton.tsx, DownloadDrillButton.tsx
    - DownloadMaterialButton.tsx, TermsPopup.tsx
  - `src/styles/`: Global CSS styles
  - `src/utils/`: Utility functions (e.g., analytics.ts)
- `static/`: Static assets (copied to public folder as-is)
  - `static/CNAME`: Custom domain configuration file
  - `static/favicons/`: Site icons and favicons
  - `static/images/`: Static images
  - `static/pdfs/`: PDF resources
- `gatsby-config.ts`: Gatsby configuration file (TypeScript)
- `gatsby-browser.tsx`: Gatsby browser APIs (TypeScript)
- `gatsby-ssr.tsx`: Gatsby SSR APIs (TypeScript)
- `tailwind.config.js`: Tailwind CSS configuration
- `postcss.config.js`: PostCSS configuration
- `tsconfig.json`: TypeScript configuration
- `package.json`: npm dependencies and scripts
- `.env.development`: Development environment variables (GATSBY_SITE_URL)
- `.env.production`: Production environment variables (GATSBY_SITE_URL)
- `.env.example`: Example environment variable template
- `.gitignore`: Configured for Gatsby (ignores `public/`, `.cache/`, `node_modules/`)
- `.github/CODEOWNERS`: Defines code ownership (@splk3 as default owner)
- `.github/dependabot.yml`: Automated dependency updates configuration

### Generated/Ignored Artifacts (Not Committed)

The following are created during development/build and excluded via `.gitignore`:

- `public/`: Generated site output (created by `npm run build`)
- `.cache/`: Gatsby cache directory (created automatically)
- `node_modules/`: npm dependencies (created by `npm install`)

## Development Guidelines

### **CRITICAL: Pre-PR Checklist**

**Before submitting any PR for review, you MUST:**

1. ✅ **Build Verification**: Run `npm run build` and ensure it completes successfully without errors
2. ✅ **Functional Testing**: Test the site functionality locally using `npm run develop`
3. ✅ **Static Compatibility**: Verify no server-side rendering (SSR) features are used
4. ✅ **JAMstack Compliance**: Ensure all dynamic features use client-side JavaScript only
5. ✅ **Clean Build Output**: Confirm the `public/` directory is generated correctly

**Failure to validate builds will result in broken deployments to GitHub Pages.**

### Working with Gatsby

1. **Local Development**:
   - Use `npm install` to install dependencies
   - Use `npm run develop` or `npm start` to run the development server
   - Server runs at `http://localhost:8000`
   - GraphQL playground available at `http://localhost:8000/___graphql`
   - Test changes locally before committing

2. **GitHub Pages Deployment**:
   - Use `npm run build` to build the production site
   - Use `npm run deploy` to deploy to GitHub Pages
   - Site uses custom domains: dev.goaliegen.com (dev) and goaliegen.com (prod)
   - Custom domain configured in `static/CNAME` file
   - No path prefix needed with custom domain setup
   - GitHub Actions workflow automates deployment on push to main branch

### Code Style

- Follow React and Gatsby best practices
- Use TypeScript for all new code (files should use .ts or .tsx extensions)
- Use functional components with hooks
- Use Tailwind CSS utility classes for styling
- Use semantic HTML for accessibility
- Write descriptive commit messages
- Keep components small and focused
- Leverage TypeScript type safety

### Content Guidelines

- Focus on youth hockey goaltending development
- Ensure content is age-appropriate and educationally valuable
- Make development plans customizable and practical

### Color Scheme

The site uses USA national colors defined in `tailwind.config.js`:
- **usa-blue**: `#002868` - Primary blue
- **usa-red**: `#BF0A30` - Accent red
- **usa-white**: `#FFFFFF` - Background/text

## Common Tasks

### Adding New Features

- Create new pages in `src/pages/` (auto-routed by Gatsby) using .tsx extension
- Add reusable components in `src/components/` using .tsx extension
- Use React functional components with TypeScript and JSX
- Import and use Tailwind CSS classes for styling
- Use Gatsby's `<Link>` component for internal navigation
- Leverage TypeScript for type safety and better IDE support

### Styling Changes

- Use Tailwind CSS utility classes in className attributes
- Edit global styles in `src/styles/global.css`
- Extend Tailwind theme in `tailwind.config.js` if needed
- Follow mobile-first responsive design with Tailwind breakpoints

### Testing and Validation

**Every code change MUST be validated before PR submission:**

1. **Development Testing**:
   - Test locally with `npm run develop`
   - Preview changes at `http://localhost:8000`
   - Check responsive design on different screen sizes
   - Verify all links and navigation work correctly

2. **Production Build Validation** (REQUIRED):
   - Run `npm run build` to test production build locally
   - Verify build completes without errors or warnings
   - Check that all assets are generated in `public/` directory
   - Serve production build with `npm run serve`
   - Test the production build at `http://localhost:9000`

3. **Static Site Validation**:
   - Ensure no server-side APIs or Node.js runtime dependencies
   - Verify all dynamic features work with client-side JavaScript only
   - Test that the site works without a backend server

## CI/CD and Workflows

### Automated Workflows

This repository uses GitHub Actions for automation:

1. **Super Linter** (`super-linter.yml`):
   - Runs on every push to any branch
   - Also runs weekly on Saturday at 2:00 AM UTC
   - Validates code quality across multiple languages and formats
   - All code changes must pass linting before merge

2. **Deploy to GitHub Pages** (`deploy.yml`):
   - Automatically deploys on push to `main` branch
   - Builds the site with `npm run build`
   - Deploys to GitHub Pages using upload-pages-artifact action
   - Uses Node.js 20 with npm caching
   - Deploys to custom domain configured in static/CNAME

3. **Test Build** (`test-build.yml`):
   - Tests that the site builds successfully
   - Runs on pull requests, manual triggers, and weekly schedule
   - Executes `npm install` and `npm run build` to verify build process

4. **Release Prep** (`release-prep.yml`):
   - Triggers on manual workflow dispatch or on release creation (filtered to releases with tags ending in `-alpha`)
   - Automatically creates GitHub issues for documentation updates
   - Creates issues titled "update README and copilot instructions"
   - Helps maintain documentation currency after releases

## JAMstack Architecture & Static Hosting Requirements

### What is JAMstack?

This site follows JAMstack (JavaScript, APIs, and Markup) architecture principles:
- **JavaScript**: Client-side dynamic functionality
- **APIs**: Third-party services and APIs (accessed from client-side)
- **Markup**: Pre-built HTML generated at build time

### Static Hosting Compatibility

**CRITICAL**: This site is hosted on GitHub Pages, which is a **static hosting service**. This means:

1. ❌ **NO Server-Side Rendering (SSR)**:
   - Do NOT use Gatsby's `getServerData()` function
   - Do NOT use server-side Node.js APIs at runtime
   - Do NOT use Express, Next.js SSR, or other server-side frameworks

2. ❌ **NO Server-Side APIs**:
   - Do NOT create API routes that require a Node.js server
   - Do NOT use server-side environment variables at runtime
   - Do NOT rely on server-side sessions or authentication

3. ✅ **ALLOWED Client-Side Features**:
   - Static Site Generation (SSG) - pages built at compile time
   - Client-side JavaScript and React hooks
   - Browser APIs (localStorage, fetch, etc.)
   - Third-party API calls from the browser
   - Client-side routing with Gatsby Link

### JAMstack Best Practices for This Project

1. **Pre-render Everything Possible**:
   - Use Gatsby's build-time data fetching
   - Generate all pages at build time
   - Keep dynamic content minimal

2. **Client-Side Dynamic Features**:
   - Use React state and hooks for interactivity
   - Store user data in browser localStorage
   - Make API calls from the browser, not the server

3. **Performance Optimization**:
   - Leverage Gatsby's automatic code splitting
   - Use lazy loading for images and components
   - Minimize bundle sizes

4. **Security**:
   - Never expose API keys in client-side code
   - Use serverless functions or third-party services for sensitive operations
   - Validate and sanitize all user inputs on the client

### Testing for Static Compatibility

Before submitting a PR, verify your code is static-hosting compatible:

```bash
# Build the static site
npm run build

# Serve it locally (simulates GitHub Pages)
npm run serve

# Test at http://localhost:9000
# The site should work WITHOUT any backend server
```

If your changes require server-side functionality, you MUST use:
- **Serverless Functions**: Deploy separate functions (e.g., Netlify Functions, AWS Lambda)
- **Third-Party APIs**: Use services like Firebase, Supabase, or other cloud providers
- **Client-Side Processing**: Move logic to the browser when possible

### Testing Locally Before Committing

- Always run `npm run develop` to test changes locally
- Verify the build succeeds with `npm run build` before pushing
- Confirm static compatibility with `npm run serve`
- Check that linting passes (super-linter will run on push)

## Working with Copilot Coding Agent

### Suitable Tasks for Copilot

Copilot coding agent works best on:
- Adding new React components or pages
- Implementing new features with clear requirements
- Updating styling with Tailwind CSS
- Refactoring code for better maintainability
- Fixing bugs with well-defined reproduction steps
- Updating documentation
- Improving accessibility

### **MANDATORY: PR Submission Requirements**

Before Copilot submits a PR for review, it MUST:

1. ✅ **Verify Build Success**:
   ```bash
   npm run build
   ```
   - Build must complete without errors
   - Verify `public/` directory is generated

2. ✅ **Test Functionality**:
   ```bash
   npm run develop
   ```
   - Manually test all changed features
   - Verify existing functionality still works

3. ✅ **Validate Static Compatibility**:
   - Ensure no SSR features are used
   - Confirm site works as a static site
   - Test with `npm run serve`

4. ✅ **Document Changes**:
   - Provide clear PR description
   - List all files modified
   - Explain testing performed

**PRs that fail to build or break existing functionality will be rejected.**

### Iteration and Feedback

- Review Copilot's pull requests thoroughly
- Provide specific feedback in PR comments
- Tag `@copilot` in comments to request changes
- Copilot will iterate based on your feedback

### Security Considerations

- Copilot runs in an isolated environment with restricted permissions
- Changes are only pushed to `copilot/*` branches
- CI/CD workflows do not run until after human review
- All changes are logged for audit and compliance
- Never include secrets or sensitive data in code

## Important Notes

- **Never commit** build artifacts (`public/`, `.cache/`)
- **Never commit** `node_modules/` directory
- **Always use TypeScript** - new files should use .ts or .tsx extensions
- **Repository URL**: `https://github.com/splk3/goalie-gen` (ensure package.json uses correct URL)
- Custom domain eliminates need for path prefix in gatsby-config.ts
- Site URL is set via GATSBY_SITE_URL environment variable
- Custom domain is configured in `static/CNAME` file
- Gatsby automatically optimizes images and assets for performance
- Keep the site lightweight and fast-loading for youth sports teams
- Use Gatsby's built-in optimizations (code splitting, prefetching, etc.)
- CODEOWNERS file designates @splk3 as the default code owner
- Dependabot automatically checks for npm and GitHub Actions updates weekly

## Common Pitfalls to Avoid

### ❌ Server-Side Features (Will Break on GitHub Pages)

**DO NOT use:**
- `getServerData()` - Requires Node.js server at runtime
- Server-side API routes (e.g., `/api/*` endpoints)
- Node.js modules that require server runtime (fs, path, etc.)
- Server-side environment variables accessed at runtime
- Database connections from server
- Express middleware or server-side routing

### ❌ Build-Time Mistakes

**DO NOT:**
- Commit `public/`, `.cache/`, or `node_modules/` directories
- Use `require()` for static assets (use `import` instead)
- Forget to test production builds before submitting PR
- Skip the `npm run build` validation step
- Use .js or .jsx extensions for new files (use .ts or .tsx)

### ✅ Correct Patterns for Static Sites

**DO use:**
- Static Site Generation (SSG) at build time
- Client-side React components and hooks (TypeScript/TSX)
- Browser APIs (localStorage, sessionStorage, fetch)
- Tailwind CSS for styling
- Client-side form handling
- Third-party APIs called from the browser
- Gatsby Link for navigation
- TypeScript for type safety

### Example: Correct vs. Incorrect

❌ **INCORRECT** (Server-side - will break):
```typescript
// This will NOT work on GitHub Pages
export async function getServerData() {
  const data = await fetchFromDatabase()
  return { props: { data } }
}
```

✅ **CORRECT** (Client-side - will work):
```typescript
// This WILL work on GitHub Pages
import React from 'react'

interface DataType {
  // Define your data structure
  id: string
  name: string
}

export default function Component() {
  const [data, setData] = React.useState<DataType | null>(null)
  
  React.useEffect(() => {
    fetch('https://api.example.com/data')
      .then(res => res.json())
      .then(setData)
  }, [])
  
  return <div>{data ? 'Loaded' : 'Loading...'}</div>
}
```

## Available npm Scripts

- `npm run develop` / `npm start` - Start development server
- `npm run build` - Build production site
- `npm run serve` - Serve production build locally
- `npm run clean` - Clean cache and public directories
- `npm run deploy` - Build and deploy to GitHub Pages

## Target Audience

The primary users are:
- Youth hockey coaches
- Goaltending coaches
- Hockey club administrators
- Parents supporting youth goalies

Design and content should be intuitive for non-technical users while providing valuable goaltending development resources.
