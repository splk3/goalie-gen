# Goalie Gen

Goalie Gen (Goaltending Development Plan Generator) is a specialized tool for youth ice hockey teams and clubs to generate customized goaltending development plans, journals, and drills.

## 🚀 Technical Stack

- **Framework:** GatsbyJS 5 (React-based SSG)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Exports:** jsPDF (PDF generation) and docx (Word generation)
- **Data:** YAML (for drill definitions)
- **Testing:** Jest & React Testing Library
- **Deployment:** GitHub Pages (Development) & Cloudflare Pages (Production)

## 🏗 Architecture & Core Logic

### Drill Management System
Drills are the core data of the application. They are stored as a "database" of folders in the `drills/` directory.

- **Dynamic Page Generation:** `gatsby-node.ts` iterates through `drills/`, validates `drill.yml` files, and creates pages at `/drills/{folder-name}` using `src/templates/drill.tsx`.
- **GraphQL Integration:** Drills are sourced into Gatsby's GraphQL layer during `sourceNodes`, allowing them to be queried throughout the site (e.g., for filtering on the `goalie-drills.tsx` page).
- **Validation:** Strict schema validation for drills is implemented in `gatsby-node.ts`. The build will fail if a `drill.yml` is invalid or contains unsupported video URLs (only YouTube/Vimeo allowed).

### Export Functionality
The project features complex client-side document generation:
- **PDF Generation:** Located in `src/utils/generateDrillPdf.ts`. Uses `jsPDF` with custom layouts for USA Hockey branding.
- **DOCX Generation:** Handled by `src/utils/docxContent.ts`.
- **Optimization:** Image downscaling and memory management are implemented in `loadImageAsDataURL` to ensure stability during PDF generation.

## 🛠 Development Workflow

### Key Commands
- `npm run develop`: Start the local development server at `http://localhost:8000`.
- `npm run build`: Generate a production-ready static build.
- `npm run test`: Execute unit tests with Jest.
- `npm run clean`: Clear Gatsby's cache and public folders (useful for troubleshooting build issues).
- `npm run deploy`: Build and deploy the current `dev` branch to GitHub Pages.

### Adding a New Drill
1. Create a folder in `drills/` named `my-new-drill`.
2. Add a `drill.yml` with required fields: `name`, `drill_steps`, `coaching_focus_points`, `drill_image`, `tags`, and `drill_creation_date`.
3. Add the referenced `drill_image` file to the same folder.
4. (Optional) Add `drill_progressions` with their own images.
5. Restart the development server to see the new page at `/drills/my-new-drill`.

## 🎨 Development Conventions

- **TypeScript First:** All new components, pages, and utilities must be fully typed.
- **Component Structure:** Components live in `src/components/` and should have corresponding tests in `__tests__/`.
- **Styling:** Use Tailwind CSS 4 utility classes. USA Hockey brand colors (`usa-blue`, `usa-red`) are available in the configuration.
- **Testing:** New features or bug fixes should include Jest tests. Use `npm test` to verify.
- **Environment:**
  - `GATSBY_SITE_URL` is used for SEO.
  - Development: `https://dev.goaliegen.com`
  - Production: `https://goaliegen.com`

## 📁 Project Structure

```text
├── drills/               # YAML-based drill database
├── src/
│   ├── components/       # Reusable React components
│   ├── content/          # Markdown for plan generation
│   ├── hooks/            # Custom React hooks (e.g., useDrillFilters)
│   ├── pages/            # Gatsby auto-routed pages
│   ├── styles/           # Global CSS and Tailwind
│   ├── templates/        # Page templates (e.g., drill.tsx)
│   ├── types/            # TypeScript interfaces
│   └── utils/            # Business logic (PDF/DOCX generation)
├── static/               # Static assets (logos, PDFs, favicons)
└── gatsby-node.ts        # Build-time logic and page generation
```
