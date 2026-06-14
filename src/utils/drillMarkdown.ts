import type { LegacyCoachingFocusPoint } from "../types/drill";

export interface DrillMarkdownHeadingBlock {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
}

export interface DrillMarkdownParagraphBlock {
  type: "paragraph";
  text: string;
}

export interface DrillMarkdownListBlock {
  type: "list";
  ordered: boolean;
  items: DrillMarkdownListItem[];
}

export interface DrillMarkdownListItem {
  text: string;
  children: DrillMarkdownListBlock[];
}

export type DrillMarkdownBlock =
  | DrillMarkdownHeadingBlock
  | DrillMarkdownParagraphBlock
  | DrillMarkdownListBlock;

type DrillMarkdownInput = string | string[] | LegacyCoachingFocusPoint[];

interface ParseListResult {
  block: DrillMarkdownListBlock;
  nextIndex: number;
}

const headingRegex = /^(\s*)(#{1,3})\s+(.+)$/;
const listItemRegex = /^(\s*)(?:([-*+])|(\d+)\.)\s+(.+)$/;
const MAX_LIST_DEPTH = 3;

const getIndent = (line: string): number => {
  let indent = 0;
  for (const ch of line) {
    if (ch === " ") {
      indent += 1;
    } else if (ch === "\t") {
      indent += 2;
    } else {
      break;
    }
  }
  return indent;
};

const extractListMatch = (
  line: string
): { indent: number; ordered: boolean; text: string } | null => {
  const match = line.match(listItemRegex);
  if (!match) {
    return null;
  }

  return {
    indent: getIndent(match[1] || ""),
    ordered: !!match[3],
    text: match[4].trim(),
  };
};

function appendOverflowNestedContent(
  lines: string[],
  startIndex: number,
  parentIndent: number,
  item: DrillMarkdownListItem
): number {
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const match = extractListMatch(line);
    if (match) {
      if (match.indent <= parentIndent) {
        break;
      }
      item.text = `${item.text} ${match.text}`.trim();
      index += 1;
      continue;
    }

    const continuationIndent = getIndent(line);
    if (continuationIndent <= parentIndent) {
      break;
    }

    item.text = `${item.text} ${line.trim()}`.trim();
    index += 1;
  }

  return index;
}

function parseList(
  lines: string[],
  startIndex: number,
  baseIndent: number,
  depth = 1
): ParseListResult {
  const firstMatch = extractListMatch(lines[startIndex]);
  if (!firstMatch) {
    return {
      block: { type: "list", ordered: false, items: [] },
      nextIndex: startIndex + 1,
    };
  }

  const ordered = firstMatch.ordered;
  const items: DrillMarkdownListItem[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const match = extractListMatch(line);
    if (!match) {
      if (items.length > 0 && getIndent(line) > baseIndent) {
        const lastItem = items[items.length - 1];
        lastItem.text = `${lastItem.text} ${line.trim()}`.trim();
        index += 1;
        continue;
      }
      break;
    }

    if (match.indent < baseIndent) {
      break;
    }

    if (match.indent > baseIndent) {
      if (items.length === 0) {
        break;
      }

      if (depth >= MAX_LIST_DEPTH) {
        index = appendOverflowNestedContent(lines, index, baseIndent, items[items.length - 1]);
      } else {
        const nested = parseList(lines, index, match.indent, depth + 1);
        items[items.length - 1].children.push(nested.block);
        index = nested.nextIndex;
      }
      continue;
    }

    if (match.ordered !== ordered && items.length > 0) {
      break;
    }

    const item: DrillMarkdownListItem = {
      text: match.text,
      children: [],
    };
    items.push(item);
    index += 1;

    while (index < lines.length) {
      const continuationLine = lines[index];
      if (!continuationLine.trim()) {
        index += 1;
        continue;
      }

      const continuationMatch = extractListMatch(continuationLine);
      if (continuationMatch) {
        if (continuationMatch.indent <= baseIndent) {
          break;
        }

        if (depth >= MAX_LIST_DEPTH) {
          index = appendOverflowNestedContent(lines, index, baseIndent, item);
        } else {
          const nested = parseList(lines, index, continuationMatch.indent, depth + 1);
          item.children.push(nested.block);
          index = nested.nextIndex;
        }
        continue;
      }

      const continuationIndent = getIndent(continuationLine);
      if (continuationIndent > baseIndent) {
        item.text = `${item.text} ${continuationLine.trim()}`.trim();
        index += 1;
        continue;
      }
      break;
    }
  }

  return {
    block: {
      type: "list",
      ordered,
      items,
    },
    nextIndex: index,
  };
}

function coerceDrillMarkdownInput(
  input: DrillMarkdownInput,
  options?: { orderedStringArray?: boolean }
): string {
  if (typeof input === "string") {
    return input;
  }

  if (!Array.isArray(input)) {
    return "";
  }

  const onlyStrings = input.every((item) => typeof item === "string");
  if (onlyStrings) {
    const items = input as string[];
    if (options?.orderedStringArray) {
      return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
    }
    return items.map((item) => `- ${item}`).join("\n");
  }

  const lines: string[] = [];
  (input as LegacyCoachingFocusPoint[]).forEach((item) => {
    if (typeof item === "string") {
      lines.push(`- ${item}`);
      return;
    }

    Object.entries(item).forEach(([heading, bullets]) => {
      lines.push(`- ${heading}`);
      bullets.forEach((bullet) => lines.push(`  - ${bullet}`));
    });
  });
  return lines.join("\n");
}

export function parseDrillMarkdown(markdownInput: DrillMarkdownInput): DrillMarkdownBlock[] {
  const markdown = coerceDrillMarkdownInput(markdownInput);
  const normalized = markdown.replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const blocks: DrillMarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(headingRegex);
    if (headingMatch && getIndent(headingMatch[1] || "") === 0) {
      blocks.push({
        type: "heading",
        level: headingMatch[2].length as 1 | 2 | 3,
        text: headingMatch[3].trim(),
      });
      index += 1;
      continue;
    }

    const listMatch = extractListMatch(line);
    if (listMatch) {
      const parsedList = parseList(lines, index, listMatch.indent);
      if (parsedList.block.items.length > 0) {
        blocks.push(parsedList.block);
      }
      index = parsedList.nextIndex;
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const paragraphLine = lines[index];
      if (!paragraphLine.trim()) {
        break;
      }
      if (paragraphLine.match(headingRegex) || extractListMatch(paragraphLine)) {
        break;
      }
      paragraphLines.push(paragraphLine.trim());
      index += 1;
    }
    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
    } else {
      index += 1;
    }
  }

  return blocks;
}

export function parseDrillStepsMarkdown(markdownInput: DrillMarkdownInput): DrillMarkdownBlock[] {
  return parseDrillMarkdown(
    typeof markdownInput === "string"
      ? markdownInput
      : coerceDrillMarkdownInput(markdownInput, { orderedStringArray: true })
  );
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

function flattenListToLines(
  list: DrillMarkdownListBlock,
  lines: string[],
  depth: number,
  parentOrderedIndex = 1
): void {
  list.items.forEach((item, itemIndex) => {
    const indent = depth > 0 ? `${"  ".repeat(depth)}` : "";
    const prefix = list.ordered ? `${parentOrderedIndex + itemIndex}. ` : "• ";
    lines.push(`${indent}${prefix}${stripInlineMarkdown(item.text)}`.trimEnd());
    item.children.forEach((child) => flattenListToLines(child, lines, depth + 1));
  });
}

export function drillMarkdownToPlainLines(
  markdownInput: DrillMarkdownInput,
  options?: { treatAsDrillSteps?: boolean }
): string[] {
  const blocks = options?.treatAsDrillSteps
    ? parseDrillStepsMarkdown(markdownInput)
    : parseDrillMarkdown(markdownInput);
  const lines: string[] = [];

  blocks.forEach((block) => {
    if (block.type === "heading") {
      lines.push(stripInlineMarkdown(block.text));
      return;
    }

    if (block.type === "paragraph") {
      lines.push(stripInlineMarkdown(block.text));
      return;
    }

    flattenListToLines(block, lines, 0);
  });

  return lines.filter((line) => line.trim().length > 0);
}

export function drillMarkdownToSearchText(markdownInput: DrillMarkdownInput): string {
  return drillMarkdownToPlainLines(markdownInput).join(" ").toLowerCase();
}
