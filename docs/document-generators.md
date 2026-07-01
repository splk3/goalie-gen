# Document Generation & Compatibility

Goalie Gen features client-side document compilers that assemble personalized development plans and goalie journals. This document details the export pipelines and the layout constraints needed to preserve formatting across Word processing software.

---

## 🖼️ Logo Upload Compatibility

- Team and club logo uploads are normalized to PNG when needed for compatibility.
- SVG uploads are rasterized to a high-resolution PNG working image (long edge 2048px) before crop, preview, and palette extraction.
- This keeps color extraction and DOCX image embedding consistent across browsers and office apps that do not reliably handle raw SVG input.

---

## 🚀 Document Compiler Features

Goalie Gen provides three separate document generation workflows:

1. **Team Plan Generator (`src/components/GenerateTeamPlanButton.tsx`)**:
   - Compiles a weekly development calendar and goalie assignments.
   - Separates **Calendar Event Types** (calendar visibility) from **Event Types for Detailed Entries** (which event detail sections are generated).
   - Embeds goalie evaluation sheets and team-level goaltending practice guidelines.
2. **Club Plan Generator (`src/components/GenerateClubPlanButton.tsx`)**:
   - Produces institutional club-wide plans for goalie training and development pathways.
   - Includes long-term season planning structures and goalie coordinator instructions.
3. **Goalie Journal Generator (`src/components/GoalieJournalButton.tsx`)**:
   - Compiles a printable journal for youth goalies as a **PDF document**.
   - Includes game log sheets, practice goals checklists, and self-evaluation templates.

---

## 🖨️ PDF Generation & Pagination

Goalie drills can be printed or exported directly as standalone PDF sheets.

### Spacing and Layout

- Managed dynamically via `src/utils/generateDrillPdf.ts` and `src/utils/estimateDrillPdfPages.ts`.
- **First Page Optimization**: Drill sheets automatically adjust between a single-column layout (if text fits) or a dual-column layout (if text overflows) to avoid empty spaces.
- **Progression Pages**: Progressions are pushed to separate pages using a two-column card layout to preserve clarity.
- **Cache and Warnings**: A build-time process estimates PDF page counts and generates warning flags if a drill's text content is estimated to overflow the page boundaries.

---

## 📄 DOCX Cross-Application Compatibility Rules

Because compiled `.docx` files are edited and printed by various users, they must render identically in **Microsoft Word**, **Google Docs**, and **LibreOffice/OpenOffice**.

The Club Plan and Team Plan document generators must strictly enforce the following formatting rules:

| Rule Category     | Required Configuration / Value                                | Rationale                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default Font**  | `Arial`                                                       | Universally pre-installed. Do not use `Helvetica` or platform-specific fonts (e.g. `Calibri` or `Segoe UI`), which cause layout and width shifts on substitution. |
| **Page Size**     | Width: `12240` twips, Height: `15840` twips                   | Explicitly forces the document to US Letter (8.5 × 11 in) rather than relying on browser or app defaults.                                                         |
| **Margins**       | Top, Right, Bottom, Left: `1440` twips (1 inch)               | Ensures standard margins across platforms.                                                                                                                        |
| **Table Width**   | Absolute DXA twips e.g. `{ size: 9360, type: WidthType.DXA }` | `WidthType.PERCENTAGE` renders inconsistently in Google Docs; absolute twips ensure table widths stay stable.                                                     |
| **Cell Width**    | Absolute DXA twips only                                       | Individual cell widths must sum exactly to the parent table width.                                                                                                |
| **Column Widths** | Explicit `columnWidths` number array                          | Required for LibreOffice `FIXED` layout tables to map column boundaries.                                                                                          |
| **Table Layout**  | `TableLayoutType.FIXED`                                       | Prevents the text processors from dynamically expanding cells based on content.                                                                                   |

### Column Spacing Math for Calendars

When dividing widths among columns, distribute any remainders from integer divisions to the very last column.

- _Example Calendar Layout (body width: 9360 twips)_:
  - Six columns of `1337` twips.
  - The seventh column gets `1338` twips (sums exactly to `9360`).

---

## 💻 CLI Document Generation Scripts

To allow quick local iteration and layout/compatibility testing without needing a browser, Goalie Gen provides three Node/TypeScript CLI document compilers. These scripts parse the same raw markdown content stored in `src/content/` and output compiled `.docx` files directly to disk.

### Available CLI Commands

| Document Type      | NPM Command                            | Underlying Script                 | Output File (Default)     |
| :----------------- | :------------------------------------- | :-------------------------------- | :------------------------ |
| **Club Plan**      | `npm run generate-test-club-plan`      | `generate-test-club-plan.ts`      | `test-club-plan.docx`     |
| **Team Plan**      | `npm run generate-test-team-plan`      | `generate-test-team-plan.ts`      | `test-team-plan.docx`     |
| **Goalie Journal** | `npm run generate-test-goalie-journal` | `generate-test-goalie-journal.ts` | `test-goalie-journal.pdf` |

---

### Command Line Arguments & Customization

You can run the underlying scripts directly using `npx tsx` to customize names, colors, logos, and outputs:

#### 1. Club Plan Generator Options

- `--name <string>`: Club Name (default: `"Test Club"`)
- `--website <string>`: Website URL (default: `"www.testclub.com"`)
- `--motto <string>`: Motto/Mission statement (default: `"Developing great goalies!"`)
- `--primary <hex>`: Primary color hex code (default: `"#00205B"`)
- `--secondary <hex>`: Secondary color hex code (default: `"#AF272F"`)
- `--logo <path>`: Local file path to a logo image (default: none)
- `--out <path>`: Destination path of the generated `.docx` (default: `"test-club-plan.docx"`)
- `--all` / `--none`: Enable/disable all optional training details and sections (default: `--all`)

#### 2. Team Plan Generator Options

- `--name <string>`: Team Name (default: `"Test Team"`)
- `--website <string>`: Website URL (default: `"www.testteam.com"`)
- `--motto <string>`: Motto/Mission statement (default: `"Strive for excellence!"`)
- `--primary <hex>`: Primary color hex code (default: `"#00205B"`)
- `--secondary <hex>`: Secondary color hex code (default: `"#AF272F"`)
- `--logo <path>`: Local file path to a logo image (default: none)
- `--out <path>`: Destination path of the generated `.docx` (default: `"test-team-plan.docx"`)
- `--age <string>`: Age Group (`8u`, `10u`, `12u`, `14u+`, default: `"12u"`)
- `--skill <string>`: Skill Level (`beginner`, `intermediate`, `advanced`, default: `"intermediate"`)
- `--all` / `--none`: Enable/disable all optional event calendars and details (default: `--all`)

#### 3. Goalie Journal Generator Options

- `--name <string>`: Goalie Name (default: `"Test Goalie"`)
- `--team <string>`: Team Name (default: `"Test Team"`)
- `--logo <path>`: Local file path to a logo image (default: none)
- `--out <path>`: Destination path of the generated `.pdf` (default: `"test-goalie-journal.pdf"`)
- `--entries <number>`: Number of blank logs to generate (default: `24`)

---

### Usage & Testing Examples

For quick manual testing and verifying layout compatibility, use the test assets under `static/images/test/logos/`:

#### Example 1: Club Plan for "Brandywine Outlaws" (JPEG logo)

```bash
npx tsx generate-test-club-plan.ts \
  --name "Brandywine Outlaws" \
  --logo static/images/test/logos/outlaws.jpeg \
  --out brandywine-outlaws-club-plan.docx
```

#### Example 2: Team Plan for "Delaware Stars" (JPG logo)

```bash
npx tsx generate-test-team-plan.ts \
  --name "Delaware Stars" \
  --logo static/images/test/logos/stars.jpg \
  --out delaware-stars-team-plan.docx
```

#### Example 3: Goalie Journal for "Delmarva Raptors" (PNG logo)

```bash
npx tsx generate-test-goalie-journal.ts \
  --name "Johnny Raptor" \
  --team "Delmarva Raptors" \
  --logo static/images/test/logos/raptors.png \
  --out delmarva-raptors-goalie-journal.pdf
```

---

## ⚠️ Guidelines for Documentation Modifications

1. Always define section page size and margins explicitly.
2. Ensure you revoke temporary blob object URLs via `OBJECT_URL_REVOKE_DELAY_MS` delay to prevent memory leaks in the browser.
3. After updating layouts, manually compile and open test files in **Google Docs** and **Microsoft Word** or **LibreOffice** to verify formatting changes.
