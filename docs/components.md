# Reusable UI Components

This document outlines key reusable UI components located under `src/components/` and explains their functions and implementation rules.

---

## 🧩 Core Page Layout Components

- **`Layout` (`src/components/PageLayout.tsx`)**: The standard container wrapper for all pages. It sets up basic CSS constraints, manages responsive content boundaries, and embeds the site Navigation Header (`Navbar`) and Page Footer (`Footer`).
- **`Navbar` (`src/components/Navbar.tsx`)**: Renders the main navigation menu with links to Drills, Resource Pages, and the Dark Mode Toggle. It uses an overlay hamburger menu on mobile devices.
- **`Footer` (`src/components/Footer.tsx`)**: Displays site copyright details, links to terms, and version information.
- **`DarkModeToggle` (`src/components/DarkModeToggle.tsx`)**: Client-side theme button that updates document classes to enable Tailwind dark mode classes based on user preferences.

---

## 🎨 Form & Color Extraction Components

- **`TeamColorPickers` (`src/components/TeamColorPickers.tsx`)**: Embedded in all document generator forms. Renders primary and secondary color input picks. Features:
  - Native color pickers.
  - Manual hex text input fields.
  - Extracted color swatches extracted from the logo.
- **`LogoPicker` / `ImageUploader` (`src/components/LogoPicker.tsx`, `src/components/ImageUploader.tsx`)**: Implements image file uploads. Features a cropping UI (using `react-image-crop`) to crop team logos to standard ratios before processing.

---

## 📊 Directory & Content Components

- **`ResourceList` (`src/components/ResourceList.tsx`)**: Reusable component used by resource pages. It loops through lists of parsed YAML resources and renders them as standard card containers with link icons and categories.
- **`DrillsGrid` (`src/components/DrillsGrid.tsx`)**: Used in drill catalogs. Displays matching drills based on active filters, complete with pagination.
- **`Pagination` (`src/components/Pagination.tsx`)**: Manages pagination buttons and controls, clamping offsets safely to prevent out-of-range navigation.
- **`DrillMarkdown` (`src/components/DrillMarkdown.tsx`)**: Helper component that parses and renders markdown fields from a drill configuration into standard HTML lists and blocks.
