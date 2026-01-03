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

### Deploying to Dev Domain

```shell
npm run build
npm run deploy
```

### Deploying to Production Domain

Set the production URL before building:

```shell
GATSBY_SITE_URL=https://goaliegen.com npm run build
npm run deploy
```

Or simply run a production build (automatically uses `.env.production`):

```shell
NODE_ENV=production npm run build
```

### Custom Domain Setup

1. Add a `CNAME` file in the `static/` directory with your domain name
2. Configure DNS records at your domain provider
3. Enable GitHub Pages in repository settings and set the custom domain

## 📝 License

See the [LICENSE](LICENSE) file for details.
