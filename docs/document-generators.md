# Document Generation & Compatibility

Goalie Gen features client-side document compilers that assemble personalized development plans and goalie journals. This document details the export pipelines and the layout constraints needed to preserve formatting across Word processing software.

---

## 🚀 Document Compiler Features

Goalie Gen provides three separate document generation workflows:

1. **Team Plan Generator (`src/components/GenerateTeamPlanButton.tsx`)**:
   - Compiles a weekly development calendar and goalie assignments.
   - Embeds goalie evaluation sheets and team-level goaltending practice guidelines.
2. **Club Plan Generator (`src/components/GenerateClubPlanButton.tsx`)**:
   - Produces institutional club-wide plans for goalie training and development pathways.
   - Includes long-term season planning structures and goalie coordinator instructions.
3. **Goalie Journal Generator (`src/components/GoalieJournalButton.tsx`)**:
   - Compiles a printable journal for youth goalies.
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

All three document generators must strictly enforce the following formatting rules:

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

## ⚠️ Guidelines for Documentation Modifications

1. Always define section page size and margins explicitly.
2. Ensure you revoke temporary blob object URLs via `OBJECT_URL_REVOKE_DELAY_MS` delay to prevent memory leaks in the browser.
3. After updating layouts, manually compile and open test files in **Google Docs** and **Microsoft Word** or **LibreOffice** to verify formatting changes.
