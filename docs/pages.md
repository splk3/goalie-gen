# Routing, Pages, and Dynamic Generation

This document describes the structure of Goalie Gen pages, routing configuration, template files, and Gatsby's build-time ingestion pipeline.

---

## 🗂 Static Pages

The page files under `src/pages/` are automatically compiled by Gatsby into corresponding URL paths:

- **Home Page (`src/pages/index.tsx`)**: High-level introduction to Goalie Gen with options to launch the document generators or explore goalie drills.
- **Goalie Drills Library (`src/pages/goalie-drills.tsx`)**: An interactive search and filtering directory containing all goalie drills in the database.
- **Goalie Evaluations (`src/pages/goalie-evals.tsx`)**: Form list and overview for downloading printable goalie evaluation templates and scorecards.
- **Resource Pages**: Pages loaded with external PDFs and links for goalie learning:
  - **Club Resources (`src/pages/club-resources.tsx`)**
  - **Coach Resources (`src/pages/coach-resources.tsx`)**
  - **Goalie Resources (`src/pages/goalie-resources.tsx`)**

---

## 📄 Dynamic Templates

- **Drill Page Template (`src/templates/drill.tsx`)**: Used to generate individual drill pages. It receives drill data via React context (`pageContext.drillData`) rather than making a GraphQL page query. It renders the markdown descriptions, steps, and embeds the PDF export button and YouTube/Vimeo video player.

---

## ⚙️ Build-time Ingestion Pipeline (`gatsby-node.ts`)

The central logic for managing and serving resources and goalie drills resides in [gatsby-node.ts](file:///home/patrick/github/splk3/goalie-gen/gatsby-node.ts). It exports four Gatsby API hooks:

### 1. `onPreBootstrap`

- Performs a clean copy of the entire `drills/` source directory into `static/drills/`.
- This ensures all drill diagram images are exposed directly as public static assets for browser loading.

### 2. `createPages`

- Reads every drill folder under `drills/` containing a `drill.yml` file.
- Parses the YAML configuration using `js-yaml` (under the `FAILSAFE_SCHEMA` to avoid unexpected type coercions).
- Validates the drill schema via `validateDrillData()`.
- Generates a page for the drill at the path `/drills/{folder-name}` using `src/templates/drill.tsx` as the template.

### 3. `sourceNodes`

- Adds each validated drill to Gatsby's GraphQL schema as a `Drill` node.
- This allows pages to query the entire drill catalogue for indexing, listing, or searching.

### 4. `onCreateWebpackConfig`

- Configures a custom Webpack loader rule for `.md` files.
- Loads markdown files as raw strings (using asset sources), which are later compiled client-side by document generators.

> [!NOTE]
> A module-level cache (`_drillsCache`) prevents duplicate file-system reads across the Gatsby hook executions, optimizing build times.

---

## 📦 Static Resource Lists Ingestion

The resource pages (`club-resources.tsx`, `coach-resources.tsx`, and `goalie-resources.tsx`) load external links dynamically from YAML databases:

1. **Storage**: Data is stored in YAML format in `src/data/*-resources-list.yml`.
2. **Ingestion**: Webpack loads the `.yml` files as raw strings.
3. **Parsing**: Pages parse the raw strings at runtime using `js-yaml`, sending the lists to [ResourceList.tsx](file:///home/patrick/github/splk3/goalie-gen/src/components/ResourceList.tsx).
4. **Validation**: Test files at `src/data/__tests__/resources-list-data.test.ts` assert that all lists conform to TypeScript resource schemas (e.g. valid URLs, unique link targets, and required fields).
