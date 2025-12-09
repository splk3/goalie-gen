# Copilot Instructions for Goaltending Development Plan Generator

## Project Overview

This repository hosts a **GatsbyJS-based GitHub Pages website** designed to help youth ice hockey teams and clubs generate customized goaltending development plans.

## Technology Stack

- **Static Site Generator**: GatsbyJS 5
- **Hosting**: GitHub Pages
- **Framework**: React 18
- **Styling**: Tailwind CSS 3 (utility-first CSS framework)
- **Build Tool**: Gatsby with PostCSS
- **Package Manager**: npm

## Repository Structure

- `public/`: Generated site (git-ignored, created by Gatsby build)
- `.cache/`: Gatsby cache directory (git-ignored)
- `node_modules/`: npm dependencies (git-ignored)
- `src/`: Source code directory
  - `src/pages/`: Page components (auto-routed by Gatsby)
  - `src/components/`: Reusable React components
  - `src/styles/`: Global CSS styles
- `static/`: Static assets (copied to public folder as-is)
- `gatsby-config.js`: Gatsby configuration file
- `gatsby-browser.js`: Gatsby browser APIs
- `tailwind.config.js`: Tailwind CSS configuration
- `postcss.config.js`: PostCSS configuration
- `package.json`: npm dependencies and scripts

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
