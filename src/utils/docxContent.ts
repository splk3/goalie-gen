import { HeadingLevel, Paragraph, TextRun } from "docx";
import type { MarkdownBlock } from "./markdownParser";

/**
 * Splits a text string into TextRun objects, italicizing any portions
 * wrapped in square brackets (e.g. [Placeholder text]).
 * Handles both fully-bracketed text and inline brackets within larger text.
 */
export function textToRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /\[[^\]]+\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }
    runs.push(new TextRun({ text: match[0], italics: true }));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

/**
 * Converts an array of parsed markdown blocks into docx Paragraph objects.
 * Italic style is applied to placeholder text wrapped in square brackets,
 * including inline occurrences such as "Focus: [Placeholder - ...]".
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
            text: block.text,
            bullet: { level: 0 },
            spacing: { after: 100 },
          }),
        ];
    }
  });
}
