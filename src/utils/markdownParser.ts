export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string };

/**
 * Parses a simple markdown string into structured blocks.
 * Supports headings (# ## ###), bullet lists (- or *), and paragraphs.
 */
export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join(" ").trim();
    if (text) {
      blocks.push({ type: "paragraph", text });
    }
    paragraphLines = [];
  };

  for (const line of lines) {
    // Skip complete single-line HTML comment lines (e.g. markdownlint inline-disable
    // directives like <!-- markdownlint-disable MD041 -->). Multi-line HTML comments
    // are not tracked since content fragments only use single-line disable directives.
    if (line.trim().startsWith("<!--") && line.trim().endsWith("-->")) {
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({ type: "heading", level, text: headingMatch[2].trim() });
      continue;
    }

    const bulletMatch = line.match(/^[ \t]*[*-]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      blocks.push({ type: "bullet", text: bulletMatch[1].trim() });
      continue;
    }

    // Indented continuation of the previous bullet (e.g. wrapped list items)
    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock?.type === "bullet" && line.match(/^[ \t]+\S/)) {
      lastBlock.text += " " + line.trim();
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    paragraphLines.push(line.trim());
  }

  flushParagraph();
  return blocks;
}
