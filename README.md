# Goalie Gen

Goalie Gen (Goaltending Development Plan Generator) makes it easy for youth ice hockey teams and clubs to generate customized goaltending development plans.

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

- **GatsbyJS 5** - Latest version of the React-based static site generator
- **TypeScript** - Strongly typed programming language that builds on JavaScript
- **Tailwind CSS 3** - Utility-first CSS framework
- **React 18** - JavaScript library for building user interfaces

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

## 🚀 Deployment

This site is configured for GitHub Pages deployment with custom domain support.

### Environment Configuration

The site URL is configured via environment variables:

- **Development**: `https://dev.goaliegen.com` (set in `.env.development`)
- **Production**: `https://goaliegen.com` (set in `.env.production`)

### Deployment Strategy

This repository uses a **single GitHub Pages site** that serves from the `gh-pages` branch. The deployment domain is controlled by the `CNAME` file in the `static/` directory.

**Current Configuration**: The `static/CNAME` file is set to `dev.goaliegen.com` for development deployments.

### Deploying to Dev Domain

The default configuration deploys to the dev domain:

```shell
npm run deploy
```

This command:
1. Builds the site using `.env.development` (defaults to `https://dev.goaliegen.com`)
2. Deploys to the `gh-pages` branch
3. GitHub Pages serves the site at `dev.goaliegen.com`

### Deploying to Production Domain

To deploy to production, you need to:

1. **Update the CNAME file** to `goaliegen.com`:
   ```shell
   echo "goaliegen.com" > static/CNAME
   ```

2. **Build with production environment**:
   ```shell
   NODE_ENV=production npm run build
   ```

3. **Deploy the production build**:
   ```shell
   npx gh-pages -d public
   ```

4. **Revert CNAME back to dev** (if needed for future dev deployments):
   ```shell
   echo "dev.goaliegen.com" > static/CNAME
   ```

**Note**: Since GitHub Pages can only serve one domain at a time per repository, switching between dev and production requires updating the CNAME file. For simultaneous dev and production environments, consider using separate repositories or branches with different GitHub Pages configurations.

### Custom Domain Setup

The custom domain setup is already configured in this repository:

1. ✅ **CNAME file**: Located at `static/CNAME` (currently set to `dev.goaliegen.com`)
2. **DNS Configuration**: Configure DNS records at your domain provider:
   - For `dev.goaliegen.com`: Add a CNAME record pointing to `splk3.github.io`
   - For `goaliegen.com`: Add A records pointing to GitHub Pages IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Add a CNAME record for `www.goaliegen.com` pointing to `splk3.github.io`
3. **GitHub Pages Settings**: In the repository settings, GitHub Pages should be enabled on the `gh-pages` branch with the custom domain matching the CNAME file

## 📝 License

See the [LICENSE](LICENSE) file for details.
