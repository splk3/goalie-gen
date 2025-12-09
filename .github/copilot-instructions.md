# Copilot Instructions for Goaltending Development Plan Generator

## Project Overview

This repository hosts a **Jekyll-based GitHub Pages website** designed to help youth ice hockey teams and clubs generate customized goaltending development plans.

## Technology Stack

- **Static Site Generator**: Jekyll
- **Hosting**: GitHub Pages
- **Templating**: Liquid templates
- **Styling**: CSS/Sass
- **Markup**: Markdown/HTML

## Repository Structure

- `_site/`: Generated site (git-ignored, created by Jekyll build)
- `.sass-cache/`, `.jekyll-cache/`, `.jekyll-metadata`: Jekyll build artifacts (git-ignored)
- `/vendor`: Bundler dependencies (git-ignored)
- `Gemfile`: Ruby dependencies for Jekyll
- `Gemfile.lock`: Git-ignored (GitHub Pages uses its own version)

## Development Guidelines

### Working with Jekyll

1. **Local Development**:
   - Use `bundle install` to install dependencies locally
   - Use `bundle exec jekyll serve` to run the development server
   - Test changes locally before committing

2. **GitHub Pages Deployment**:
   - GitHub Pages automatically builds and deploys from the default branch
   - No need to commit `_site/` or build artifacts
   - GitHub Pages uses its own version of the pages-gem

### Code Style

- Follow Jekyll best practices for layouts, includes, and data files
- Use semantic HTML for accessibility
- Keep CSS/Sass organized and maintainable
- Write descriptive commit messages

### Content Guidelines

- Focus on youth hockey goaltending development
- Ensure content is age-appropriate and educationally valuable
- Make development plans customizable and practical

## Common Tasks

### Adding New Features

- Create layouts in `_layouts/`
- Add reusable components in `_includes/`
- Store data in `_data/` as YAML or JSON
- Add pages as Markdown or HTML files

### Styling Changes

- Edit Sass/CSS files (typically in `_sass/` or `assets/css/`)
- Use Jekyll's asset pipeline for compilation

### Testing

- Test locally with `bundle exec jekyll serve`
- Preview changes at `http://localhost:4000`
- Check responsive design on different screen sizes
- Verify all links and navigation work correctly

## Important Notes

- **Never commit** `Gemfile.lock` - GitHub Pages manages its own versions
- **Never commit** build artifacts (`_site/`, caches)
- Ensure all changes are compatible with GitHub Pages' supported Jekyll versions and plugins
- Keep the site lightweight and fast-loading for youth sports teams

## Target Audience

The primary users are:
- Youth hockey coaches
- Goaltending coaches
- Hockey club administrators
- Parents supporting youth goalies

Design and content should be intuitive for non-technical users while providing valuable goaltending development resources.
