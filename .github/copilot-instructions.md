# Copilot Instructions for Goaltending Development Plan Generator

## Project Overview

This repository hosts a **GatsbyJS-based GitHub Pages website** designed to help youth ice hockey teams and clubs generate customized goaltending development plans.

**Note**: This is a Gatsby project (not Jekyll). The `.gitignore` is configured for Gatsby with entries for `public/`, `.cache/`, and `node_modules/`.

## Technology Stack

- **Static Site Generator**: GatsbyJS 5
- **Hosting**: GitHub Pages
- **Framework**: React 18
- **Styling**: Tailwind CSS 3 (utility-first CSS framework)
- **Build Tool**: Gatsby with PostCSS
- **Package Manager**: npm

## Repository Structure

### Source Files (Committed to Git)

The following files and directories are part of the repository:

- `src/`: Source code directory
  - `src/pages/`: Page components (auto-routed by Gatsby)
  - `src/components/`: Reusable React components (if created)
  - `src/styles/`: Global CSS styles
- `static/`: Static assets (copied to public folder as-is)
- `gatsby-config.js`: Gatsby configuration file
- `gatsby-browser.js`: Gatsby browser APIs
- `tailwind.config.js`: Tailwind CSS configuration
- `postcss.config.js`: PostCSS configuration
- `package.json`: npm dependencies and scripts
- `.gitignore`: Configured for Gatsby (ignores `public/`, `.cache/`, `node_modules/`)

### Generated/Ignored Artifacts (Not Committed)

The following are created during development/build and excluded via `.gitignore`:

- `public/`: Generated site output (created by `npm run build`)
- `.cache/`: Gatsby cache directory (created automatically)
- `node_modules/`: npm dependencies (created by `npm install`)

## Development Guidelines

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
   - Site is deployed to `https://splk3.github.io/goaltending-development-plan-generator/`
   - Path prefix is configured in `gatsby-config.js`
   - GitHub Actions workflow may automate deployment

### Code Style

- Follow React and Gatsby best practices
- Use functional components with hooks
- Use Tailwind CSS utility classes for styling
- Use semantic HTML for accessibility
- Write descriptive commit messages
- Keep components small and focused

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

- Create new pages in `src/pages/` (auto-routed by Gatsby)
- Add reusable components in `src/components/`
- Use React functional components with JSX
- Import and use Tailwind CSS classes for styling
- Use Gatsby's `<Link>` component for internal navigation

### Styling Changes

- Use Tailwind CSS utility classes in className attributes
- Edit global styles in `src/styles/global.css`
- Extend Tailwind theme in `tailwind.config.js` if needed
- Follow mobile-first responsive design with Tailwind breakpoints

### Testing

- Test locally with `npm run develop`
- Preview changes at `http://localhost:8000`
- Check responsive design on different screen sizes
- Verify all links and navigation work correctly
- Run `npm run build` to test production build locally
- Serve production build with `npm run serve`

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
   - Deploys to GitHub Pages using upload-pages-artifact
   - Uses Node.js 20 with npm caching

### Testing Locally Before Committing

- Always run `npm run develop` to test changes locally
- Verify the build succeeds with `npm run build` before pushing
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
- The path prefix `/goaltending-development-plan-generator` is required for GitHub Pages deployment
- Gatsby automatically optimizes images and assets for performance
- Keep the site lightweight and fast-loading for youth sports teams
- Use Gatsby's built-in optimizations (code splitting, prefetching, etc.)

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
