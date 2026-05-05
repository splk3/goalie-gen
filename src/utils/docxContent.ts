import { HeadingLevel, Paragraph, TextRun } from "docx";
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
export function textToRuns(text: string): TextRun[] {
  return parseRunData(text).map(
    (run) => new TextRun({ text: run.text, italics: run.italics || undefined })
  );
}

/**
 * Converts an array of parsed markdown blocks into docx Paragraph objects.
 * For both paragraph and bullet blocks, italic style is applied to placeholder
 * text wrapped in square brackets, including inline occurrences such as
 * "Focus: [Placeholder]".
 */
export function blocksToDocxParagraphs(blocks: MarkdownBlock[]): Paragraph[] {
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
            text: block.text,
            heading: level,
            spacing: { before: 400, after: 200 },
          }),
        ];
      }
      case "paragraph":
        return [
          new Paragraph({
            children: textToRuns(block.text),
            spacing: { after: 300 },
          }),
        ];
      case "bullet":
        return [
          new Paragraph({
            children: textToRuns(block.text),
            bullet: { level: 0 },
            spacing: { after: 100 },
          }),
        ];
    }
  });
}
