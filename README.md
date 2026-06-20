# Goalie Gen

Goalie Gen (Goaltending Development Plan Generator) makes it easy for youth ice hockey teams and clubs to generate customized goaltending development plans.

## 🎯 Features

- **Individual Development Plans**: Generate personalized goaltending development plans
- **Team Development Plans**: Create development plans for entire goaltending rosters
- **Goalie Journal**: Export printable goalie journals for tracking progress
- **Drill Library**: Access and download various goaltending drills
- **Content Freshness Indicators**: Automatically highlights new and recently updated drills with "New Content!" or "Updated Content!" badges
- **PDF/DOCX Export**: Export plans in multiple formats using jsPDF and docx libraries
- **Team Color Customization**: Pick primary and secondary team colors for exported documents; colors are auto-extracted from an uploaded club or team logo using `colorthief`
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

## 🛠 Tech Stack Summary

- **GatsbyJS 5** & **React 19**
- **TypeScript** & **Tailwind CSS 4**
- **jsPDF** & **docx** (Word) exporters
- **colorthief** logo color extraction

---

## 📁 Technical Documentation

For detailed guides on setup, directories, schemas, and layouts, see the documentation files:

- 🏗️ **[Architecture & Tech Stack](docs/architecture.md)**: Details on framework, design system color tokens, directories, and repository configurations.
- 📄 **[Routing & Pages](docs/pages.md)**: Summary of Gatsby routing, pages structure, dynamic templates, and ingestion pipelines.
- 🧊 **[Drill Database & Schema](docs/drills.md)**: Full validation guidelines, required tags list, YAML schema details, and video constraints.
- 🧩 **[UI Components Review](docs/components.md)**: Index and specifications of common reusable UI components.
- 🖨️ **[Document Generation & Compatibility](document-generators.md)**: PDF layout optimization rules and DOCX Cross-Application Compatibility guidelines.
- 🧪 **[Testing Guide](docs/testing.md)**: Commands, mocks, Jest setups, and drill pagination verification tests.
- 🔄 **[CI/CD & Deployments](docs/ci-cd.md)**: Deployment environments, setup links, and GitHub Actions workflow descriptions.

---

## 📦 Available Scripts

- `npm run develop` - Start the local development server at `http://localhost:8000`
- `npm run build` - Compile a production-ready static build
- `npm run serve` - Serve the production build locally at `http://localhost:9000`
- `npm run clean` - Clear Gatsby cache and public folders
- `npm run deploy` - Build and deploy to GitHub Pages
- `npm test` - Run unit tests with Jest
- `npm run verify-drills` - Run PDF pagination verification checks

---

## 🤝 Contributing

This is a Gatsby/React project with TypeScript. When contributing:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes (ensure TypeScript and Tailwind CSS conventions are followed)
4. Test locally with `npm run develop` and `npm run build`
5. Commit your changes with clear messages
6. Push to your branch
7. Open a Pull Request

For detailed development guidelines, see [AGENTS.md](file:///home/patrick/github/splk3/goalie-gen/AGENTS.md) or `.github/copilot-instructions.md`.

## 📝 License

This project is licensed under the BSD-3-Clause License. See the [LICENSE](LICENSE) file for details.
