export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "field"; label: string; lines: number }
  | { type: "fields"; rows: Array<{ left: string; right: string }> }
  | { type: "image"; alt: string; src: string }
  | { type: "spacer" };

function splitTableRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith("|")) {
    row = row.slice(1);
  }
  if (row.endsWith("|") && !row.endsWith("\\|")) {
    row = row.slice(0, -1);
  }

  const cells: string[] = [];
  let cell = "";
  for (let index = 0; index < row.length; index++) {
    const character = row[index];
    if (character === "\\" && (row[index + 1] === "|" || row[index + 1] === "\\")) {
      cell += row[index + 1];
      index++;
    } else if (character === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function isTableSeparatorRow(line: string, columnCount: number): boolean {
  const cells = splitTableRow(line);
  return cells.length === columnCount && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function parseTableAt(
  lines: string[],
  startIndex: number
): {
  block: Extract<MarkdownBlock, { type: "table" }>;
  nextIndex: number;
} | null {
  if (startIndex + 1 >= lines.length || !lines[startIndex].includes("|")) {
    return null;
  }

  const headers = splitTableRow(lines[startIndex]);
  if (headers.length < 1 || !isTableSeparatorRow(lines[startIndex + 1], headers.length)) {
    return null;
  }

  const rows: string[][] = [];
  let nextIndex = startIndex + 2;
  while (nextIndex < lines.length && lines[nextIndex].trim() !== "") {
    if (!lines[nextIndex].includes("|")) {
      break;
    }
    const row = splitTableRow(lines[nextIndex]);
    if (row.length !== headers.length) {
      break;
    }
    rows.push(row);
    nextIndex++;
  }

  return {
    block: { type: "table", headers, rows },
    nextIndex,
  };
}

function parseSeasonTableAt(
  lines: string[],
  startIndex: number
): {
  block: Extract<MarkdownBlock, { type: "table" }>;
  nextIndex: number;
} | null {
  if (lines[startIndex].trim() !== ":::season-table") {
    return null;
  }

  const headerLine = lines[startIndex + 1]?.match(/^headers:\s*(.+)$/);
  if (!headerLine) {
    return null;
  }

  const headers = headerLine[1].split(";").map((header) => header.trim());
  if (headers.length < 1 || headers.some((header) => header.length === 0)) {
    return null;
  }

  const rows: string[][] = [];
  let nextIndex = startIndex + 2;
  while (nextIndex < lines.length) {
    if (lines[nextIndex].trim() === "") {
      nextIndex++;
      continue;
    }
    if (lines[nextIndex].trim() === ":::") {
      break;
    }

    const phaseMatch = lines[nextIndex].match(/^[ \t]*-\s+phase:\s*(.+)$/);
    const skillsMatch = lines[nextIndex + 1]?.match(/^[ \t]+skills:\s*(.+)$/);
    if (!phaseMatch || !skillsMatch) {
      return null;
    }
    rows.push([phaseMatch[1].trim(), skillsMatch[1].trim()]);
    nextIndex += 2;
  }

  if (nextIndex >= lines.length || rows.length === 0 || headers.length !== 2) {
    return null;
  }

  return {
    block: { type: "table", headers, rows },
    nextIndex: nextIndex + 1,
  };
}

/**
 * Parses a simple markdown string into structured blocks.
 * Supports headings (# ## ###), bullet lists (- or *), pipe tables, compact
 * season tables, and fill-in fields such as [[FIELD:Game Notes|3]] or
 * [[FIELDS:Opponent|Venue]].
 */
export function parseMarkdown(
  markdown: string,
  options: { preserveBlankLines?: boolean } = {}
): MarkdownBlock[] {
  const lines = markdown.split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let previousLineWasBlank = false;

  const flushParagraph = () => {
    const text = paragraphLines.join(" ").trim();
    if (text) {
      blocks.push({ type: "paragraph", text });
    }
    paragraphLines = [];
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    // Skip complete single-line HTML comment lines (e.g. markdownlint inline-disable
    // directives like <!-- markdownlint-disable MD041 -->). Multi-line HTML comments
    // are not tracked since content fragments only use single-line disable directives.
    if (line.trim().startsWith("<!--") && line.trim().endsWith("-->")) {
      continue;
    }

    const fieldMatch = line.trim().match(/^\[\[FIELD:\s*(.+?)(?:\|(\d+))?\s*\]\]$/);
    if (fieldMatch) {
      flushParagraph();
      blocks.push({
        type: "field",
        label: fieldMatch[1].trim(),
        lines: Math.max(1, Number(fieldMatch[2] || 1)),
      });
      continue;
    }

    const fieldsMatch = line.trim().match(/^\[\[FIELDS:\s*([^|]+?)\s*\|\s*([^|]+?)\s*\]\]$/);
    if (fieldsMatch) {
      flushParagraph();
      const lastBlock = blocks[blocks.length - 1];
      const row = { left: fieldsMatch[1].trim(), right: fieldsMatch[2].trim() };
      if (lastBlock?.type === "fields") {
        lastBlock.rows.push(row);
      } else {
        blocks.push({ type: "fields", rows: [row] });
      }
      continue;
    }

    const seasonTable = parseSeasonTableAt(lines, lineIndex);
    if (seasonTable) {
      flushParagraph();
      blocks.push(seasonTable.block);
      lineIndex = seasonTable.nextIndex - 1;
      previousLineWasBlank = false;
      continue;
    }

    const table = parseTableAt(lines, lineIndex);
    if (table) {
      flushParagraph();
      blocks.push(table.block);
      lineIndex = table.nextIndex - 1;
      previousLineWasBlank = false;
      continue;
    }

    const imageMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushParagraph();
      blocks.push({ type: "image", alt: imageMatch[1], src: imageMatch[2] });
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
      if (options.preserveBlankLines && previousLineWasBlank) {
        blocks.push({ type: "spacer" });
      }
      previousLineWasBlank = true;
      continue;
    }

    previousLineWasBlank = false;
    paragraphLines.push(line.trim());
  }

  flushParagraph();
  return blocks;
}
