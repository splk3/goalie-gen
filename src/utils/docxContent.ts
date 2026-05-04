import { HeadingLevel, Paragraph, TextRun } from "docx";
import type { MarkdownBlock } from "./markdownParser";

/**
 * Converts an array of parsed markdown blocks into docx Paragraph objects.
 * Italic style is applied to placeholder text wrapped in square brackets.
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
            children: [
              new TextRun({
                text: block.text,
                italics: block.text.startsWith("[") && block.text.endsWith("]"),
              }),
            ],
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
