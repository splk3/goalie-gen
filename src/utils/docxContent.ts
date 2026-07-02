import { HeadingLevel, Paragraph, TextRun, ExternalHyperlink } from "docx";
import type { MarkdownBlock } from "./markdownParser";

/**
 * Data representation of a single text run before it is converted to a docx
 * TextRun. Plain objects are easier to assert against in tests than docx
 * instances.
 */
export interface RunData {
  text: string;
  italics: boolean;
}

export interface DocxColorOptions {
  /** Raw hex color string — may include or omit a leading `#`. */
  primaryColor?: string;
  /** Raw hex color string — may include or omit a leading `#`. */
  secondaryColor?: string;
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
  const runs: RunData[] = [];
  const regex = /\[[^\]]+\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index), italics: false });
    }
    runs.push({ text: match[0], italics: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex), italics: false });
  }

  if (runs.length === 0) {
    runs.push({ text, italics: false });
  }

  return runs;
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
}

/**
 * Parses a string to identify plain text, placeholders in square brackets,
 * and markdown links of the format [text](url).
 */
export function parseSegments(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        text: text.slice(lastIndex, match.index),
      });
    }

    if (match[1] !== undefined && match[2] !== undefined) {
      segments.push({
        type: "link",
        text: match[1],
        url: match[2],
      });
    } else if (match[3] !== undefined) {
      segments.push({
        type: "placeholder",
        text: `[${match[3]}]`,
      });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      text: text.slice(lastIndex),
    });
  }

  if (segments.length === 0) {
    segments.push({
      type: "text",
      text,
    });
  }

  return segments;
}

/**
 * Converts a text string into an array of docx ParagraphChild objects (either TextRun
 * or ExternalHyperlink). Italicizes placeholder text in square brackets (e.g. [Placeholder]),
 * and converts markdown links (e.g. [text](url)) into clickable ExternalHyperlinks.
 */
export function textToParagraphChildren(
  text: string,
  primaryColor: string = "000000",
  textColor: string = "000000"
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
          }),
        ],
      });
    }
    return new TextRun({
      text: segment.text,
      italics: segment.type === "placeholder" ? true : undefined,
      color: textColor,
    });
  });
}

/**
 * Converts an array of parsed markdown blocks into docx Paragraph objects.
 * For both paragraph and bullet blocks, italic style is applied to placeholder
 * text wrapped in square brackets, including inline occurrences such as
 * "Focus: [Placeholder]". Markdown links [text](url) are parsed and rendered
 * as clickable hyperlinks.
 */
export function blocksToDocxParagraphs(
  blocks: MarkdownBlock[],
  options?: DocxColorOptions
): Paragraph[] {
  const primary = cleanHexColor(options?.primaryColor);
  const secondary = cleanHexColor(options?.secondaryColor);

  return blocks.flatMap((block) => {
    switch (block.type) {
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
    }
  });
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
