import {
  AlignmentType,
  BorderStyle,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { MarkdownBlock } from "./markdownParser";
import { parseInlineMarkdown } from "./inlineMarkdown";

const DOCX_CONTENT_WIDTH_TWIPS = 9360;

/**
 * Data representation of a single text run before it is converted to a docx
 * TextRun. Plain objects are easier to assert against in tests than docx
 * instances.
 */
export interface RunData {
  text: string;
  italics: boolean;
  bold?: boolean;
}

export interface DocxColorOptions {
  /** Raw hex color string — may include or omit a leading `#`. */
  primaryColor?: string;
  /** Raw hex color string — may include or omit a leading `#`. */
  secondaryColor?: string;
  /** Keep each table together when it fits on one page. */
  keepTablesTogether?: boolean;
  images?: Record<string, DocxImageData>;
}

export interface DocxImageData {
  data: ArrayBuffer | Buffer;
  type: "png" | "jpg" | "gif" | "bmp";
  width: number;
  height: number;
}

/**
 * Helper to clean a hex color string (removes leading # if present).
 * If no color is provided or the string is empty, returns "000000".
 */
export function cleanHexColor(color?: string): string {
  if (!color) return "000000";
  return color.replace(/^#/, "");
}

/**
 * Splits a text string into RunData objects, italicizing any portions wrapped
 * in square brackets (e.g. [Placeholder text]). Handles both fully-bracketed
 * text and inline brackets within larger text such as "Focus: [Placeholder]".
 */
export function parseRunData(text: string): RunData[] {
  const segments = parseInlineMarkdown(text);
  if (segments.length === 0) {
    return [{ text: "", italics: false }];
  }
  return segments.map((segment) => ({
    text: segment.text,
    italics: segment.italics === true || segment.type === "placeholder",
    ...(segment.bold ? { bold: true } : {}),
  }));
}

/**
 * Converts a text string into docx TextRun objects, italicizing any portions
 * wrapped in square brackets (e.g. [Placeholder text]).
 */
export function textToRuns(text: string, color: string = "000000"): TextRun[] {
  return parseRunData(text).map(
    (run) => new TextRun({ text: run.text, italics: run.italics || undefined, color })
  );
}

export interface ParsedSegment {
  type: "text" | "placeholder" | "link";
  text: string;
  url?: string;
  bold?: boolean;
  italics?: boolean;
}

/**
 * Parses a string to identify plain text, placeholders in square brackets,
 * and markdown links of the format [text](url).
 */
export function parseSegments(text: string): ParsedSegment[] {
  const segments = parseInlineMarkdown(text);
  return segments.length > 0 ? segments : [{ type: "text", text }];
}

/**
 * Converts a text string into an array of docx ParagraphChild objects (either TextRun
 * or ExternalHyperlink). Supports Markdown bold and italics, italicizes placeholder text
 * in square brackets, and converts markdown links into clickable ExternalHyperlinks.
 */
export function textToParagraphChildren(
  text: string,
  primaryColor: string = "000000",
  textColor: string = "000000",
  bold = false
): (TextRun | ExternalHyperlink)[] {
  return parseSegments(text).map((segment) => {
    if (segment.type === "link") {
      return new ExternalHyperlink({
        link: segment.url || "",
        children: [
          new TextRun({
            text: segment.text,
            color: primaryColor,
            underline: { type: "single" },
            bold: bold || segment.bold || undefined,
            italics: segment.italics || undefined,
          }),
        ],
      });
    }
    return new TextRun({
      text: segment.text,
      italics: segment.italics || segment.type === "placeholder" || undefined,
      bold: bold || segment.bold || undefined,
      color: textColor,
    });
  });
}

export type DocxContent = Paragraph | Table;

function getTableColumnWidths(columnCount: number): number[] {
  const baseWidth = Math.floor(DOCX_CONTENT_WIDTH_TWIPS / columnCount);
  const remainder = DOCX_CONTENT_WIDTH_TWIPS - baseWidth * columnCount;
  return Array.from({ length: columnCount }, (_, index) =>
    index === columnCount - 1 ? baseWidth + remainder : baseWidth
  );
}

function createTableCellParagraphs(
  text: string,
  primaryColor: string,
  isHeader: boolean,
  keepNext: boolean
): Paragraph[] {
  return text.split(/<br\s*\/?>/gi).map(
    (line) =>
      new Paragraph({
        children: textToParagraphChildren(line, primaryColor, "000000", isHeader),
        spacing: { after: 40 },
        keepNext,
      })
  );
}

function tableBlockToDocxTable(
  block: Extract<MarkdownBlock, { type: "table" }>,
  primaryColor: string,
  keepTablesTogether: boolean
): Table {
  const columnWidths = getTableColumnWidths(block.headers.length);
  const rows = [block.headers, ...block.rows].map((cells, rowIndex) => {
    const isHeader = rowIndex === 0;
    return new TableRow({
      cantSplit: true,
      tableHeader: isHeader,
      children: cells.map(
        (cell, cellIndex) =>
          new TableCell({
            width: { size: columnWidths[cellIndex], type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            shading: isHeader ? { fill: "EDEDED" } : undefined,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "B7B7B7" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "B7B7B7" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "B7B7B7" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "B7B7B7" },
            },
            children: createTableCellParagraphs(
              cell,
              primaryColor,
              isHeader,
              keepTablesTogether && rowIndex < block.rows.length
            ),
          })
      ),
    });
  });

  return new Table({
    width: { size: DOCX_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths,
    rows,
  });
}

function fillInFieldToDocxTable(
  block: Extract<MarkdownBlock, { type: "field" }>,
  primaryColor: string
): Table {
  const labelWidth = 1800;
  const inputWidth = DOCX_CONTENT_WIDTH_TWIPS - labelWidth;
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const rows = Array.from({ length: block.lines }, (_, index) => {
    const showLabel = index === 0;
    return new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: labelWidth, type: WidthType.DXA },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: showLabel ? block.label : "",
                  color: primaryColor,
                  bold: showLabel,
                }),
              ],
              keepNext: index < block.lines - 1,
            }),
          ],
        }),
        new TableCell({
          width: { size: inputWidth, type: WidthType.DXA },
          borders: {
            top: noBorder,
            left: noBorder,
            right: noBorder,
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { after: 120 },
              keepNext: index < block.lines - 1,
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    width: { size: DOCX_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [labelWidth, inputWidth],
    rows,
  });
}

function compactFieldsToDocxTable(
  block: Extract<MarkdownBlock, { type: "fields" }>,
  primaryColor: string
): Table {
  const labelWidth = 1500;
  const inputWidth = 3180;
  const columnWidths = [labelWidth, inputWidth, labelWidth, inputWidth];
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const rows = block.rows.map(
    ({ left, right }, rowIndex) =>
      new TableRow({
        cantSplit: true,
        children: [left, right].flatMap((label, index) => [
          new TableCell({
            width: { size: columnWidths[index * 2], type: WidthType.DXA },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    color: primaryColor,
                    bold: true,
                  }),
                ],
                keepNext: rowIndex < block.rows.length - 1,
              }),
            ],
          }),
          new TableCell({
            width: { size: columnWidths[index * 2 + 1], type: WidthType.DXA },
            borders: {
              top: noBorder,
              left: noBorder,
              right: noBorder,
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "" })],
                spacing: { after: 120 },
                keepNext: rowIndex < block.rows.length - 1,
              }),
            ],
          }),
        ]),
      })
  );

  return new Table({
    width: { size: DOCX_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths,
    rows,
  });
}

/**
 * Converts parsed markdown blocks into native DOCX paragraphs and fixed-width tables.
 */
export function blocksToDocxContent(
  blocks: MarkdownBlock[],
  options?: DocxColorOptions
): DocxContent[] {
  const primary = cleanHexColor(options?.primaryColor);
  const secondary = cleanHexColor(options?.secondaryColor);
  const keepTablesTogether = options?.keepTablesTogether ?? true;

  return blocks.flatMap((block): DocxContent[] => {
    switch (block.type) {
      case "table":
        return [tableBlockToDocxTable(block, primary, keepTablesTogether)];
      case "field":
        return [fillInFieldToDocxTable(block, primary)];
      case "fields":
        return [compactFieldsToDocxTable(block, primary)];
      case "heading": {
        const level =
          block.level === 1
            ? HeadingLevel.HEADING_1
            : block.level === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3;
        return [
          new Paragraph({
            children: [new TextRun({ text: block.text, color: primary, bold: true })],
            heading: level,
            spacing: { before: 400, after: 200 },
          }),
        ];
      }
      case "paragraph":
        return [
          new Paragraph({
            children: textToParagraphChildren(block.text, primary, "000000"),
            spacing: { after: 300 },
          }),
        ];
      case "bullet":
        return [
          new Paragraph({
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({
                text: "▪  ",
                color: secondary,
                bold: true,
              }),
              ...textToParagraphChildren(block.text, primary, "000000"),
            ],
            spacing: { after: 100 },
          }),
        ];
      case "image": {
        const image = options?.images?.[block.src];
        if (!image) {
          return [
            new Paragraph({
              children: [new TextRun({ text: block.alt, color: "000000" })],
              spacing: { after: 300 },
            }),
          ];
        }
        return [
          new Paragraph({
            children: [
              new ImageRun({
                type: image.type,
                data: image.data,
                transformation: { width: image.width, height: image.height },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 300 },
          }),
        ];
      }
      case "spacer":
        return [
          new Paragraph({
            children: [new TextRun({ text: "" })],
            spacing: { after: 300 },
          }),
        ];
    }
  });
}

/**
 * Converts an array of parsed markdown blocks into docx Paragraph objects.
 * For both paragraph and bullet blocks, italic style is applied to placeholder
 * text wrapped in square brackets, including inline occurrences such as
 * "Focus: [Placeholder]". Markdown links [text](url) are parsed and rendered
 * as clickable hyperlinks. Use blocksToDocxContent when table blocks should be
 * included in the output.
 */
export function blocksToDocxParagraphs(
  blocks: MarkdownBlock[],
  options?: DocxColorOptions
): Paragraph[] {
  return blocksToDocxContent(blocks, options).filter(
    (content): content is Paragraph => content instanceof Paragraph
  );
}

/**
 * Docx classes needed by makeDocxHeaderFooter. These are lazy-loaded via
 * loadDocxModule() in the caller, so they are passed in as arguments rather
 * than imported directly (which would break SSR/SSG).
 */
export interface DocxHeaderFooterClasses {
  Header: typeof import("docx").Header;
  Footer: typeof import("docx").Footer;
  BorderStyle: typeof import("docx").BorderStyle;
  TabStopType: typeof import("docx").TabStopType;
  PageNumber: typeof import("docx").PageNumber;
  Paragraph: typeof import("docx").Paragraph;
  TextRun: typeof import("docx").TextRun;
  AlignmentType: typeof import("docx").AlignmentType;
}

/**
 * Builds the headers and footers section objects for a DOCX document section.
 *
 * - Header: right-aligned label in primaryColor, with a secondaryColor border
 *   line underneath. Suppressed on the cover/title page via `titlePage: true`
 *   on the section properties.
 * - Footer: centered page number in secondaryColor, with a secondaryColor
 *   border line above.
 *
 * @param headerLabel   Text shown in the running header (e.g. "MY TEAM GOALTENDING DEVELOPMENT PLAN").
 * @param cleanPrimary  Six-digit hex string (no leading #) for the primary color.
 * @param cleanSecondary Six-digit hex string (no leading #) for the secondary color.
 * @param classes       Lazy-loaded docx class references.
 */
export function makeDocxHeaderFooter(
  headerLabel: string,
  cleanPrimary: string,
  cleanSecondary: string,
  classes: DocxHeaderFooterClasses
): {
  headers: { default: import("docx").Header };
  footers: { default: import("docx").Footer };
} {
  const { Header, Footer, BorderStyle, PageNumber, Paragraph, TextRun, AlignmentType } = classes;

  return {
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: headerLabel,
                size: 18,
                color: cleanPrimary,
                bold: true,
              }),
            ],
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 18,
                space: 4,
                color: cleanSecondary,
              },
            },
            spacing: { after: 120 },
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                children: ["Page ", PageNumber.CURRENT],
                size: 18,
                color: cleanPrimary,
                bold: true,
              }),
            ],
            border: {
              top: {
                style: BorderStyle.SINGLE,
                size: 18,
                space: 4,
                color: cleanSecondary,
              },
            },
            spacing: { before: 120 },
          }),
        ],
      }),
    },
  };
}
