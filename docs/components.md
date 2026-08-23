# Reusable UI Components

This document outlines key reusable UI components located under `src/components/` and explains their functions and implementation rules.

---

## 🧩 Core Page Layout Components

- **`Layout` (`src/components/PageLayout.tsx`)**: The standard container wrapper for all pages. It sets up basic CSS constraints, manages responsive content boundaries, and embeds the site Navigation Header (`HamburgerMenu`) and Page Footer.
- **`HamburgerMenu` (`src/components/HamburgerMenu.tsx`)**: Renders the main navigation menu with links to Drills, Resource Pages, and the Dark Mode Toggle. It uses an overlay hamburger menu on mobile devices.
- **`DarkModeToggle` (`src/components/DarkModeToggle.tsx`)**: Client-side theme button that updates document classes to enable Tailwind dark mode classes based on user preferences.

---

## 🎨 Form & Color Extraction Components

- **`TeamColorPickers` (`src/components/TeamColorPickers.tsx`)**: Embedded in all document generator forms. Renders primary and secondary color input picks. Features:
  - Custom popover color picker using `react-colorful`'s `HexColorPicker` (not the browser's native color picker, which has cross-platform HSV bugs).
  - `HexColorInput` for direct hex text entry.
  - Extracted color swatches from the uploaded logo.
- **`ImageUploader` (`src/components/ImageUploader.tsx`)**: Implements image file uploads. Features a cropping UI (using `react-image-crop`) to crop team logos to standard ratios before processing. SVG uploads are rasterized to PNG before cropping.

---

## 📊 Directory & Content Components

- **`ResourceList` (`src/components/ResourceList.tsx`)**: Reusable component used by resource pages. It loops through lists of parsed YAML resources and renders them as standard card containers with link icons and categories.
- **`Pagination` (`src/components/Pagination.tsx`)**: Manages pagination buttons and controls, clamping offsets safely to prevent out-of-range navigation.
- **`DrillMarkdown` (`src/components/DrillMarkdown.tsx`)**: Helper component that parses and renders markdown fields from a drill configuration into standard HTML lists and blocks.
- **`INeedADrillButton` (`src/components/INeedADrillButton.tsx`)**: Interactive drill recommendation widget that applies the shared `useDrillFilters` hook to suggest matching drills.

---

## 📈 Analytics Event Tracking

- **`trackEvent` (`src/utils/analytics.ts`)** is the shared Google Analytics event helper used by generators and resource interactions.
- Plan and journal flows are tracked as separate GA4 events:
  - `generate_team_plan`, `download_team_plan`
  - `generate_club_plan`, `download_club_plan`
  - `generate_goalie_journal`, `download_goalie_journal`
- Keep payload keys consistent (`format`, `team_name`, `club_name`, `*_name_provided`, `season_provided`) so GA4 exploration reports remain stable.

### Required GA4 Configuration

To make these events useful in GA4:

1. Register event-scoped custom dimensions for any payload keys you want in reports (for example: `format`, `team_name_provided`, `club_name_provided`, `season_provided`, `age_group`).
2. Mark generation events (`generate_team_plan`, `generate_club_plan`, `generate_goalie_journal`) as **Key events**.
3. Keep download events as regular events, then build an Exploration/funnel that compares generate vs download completion by flow.
