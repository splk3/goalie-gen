import { TextRun } from "docx";
import { textToRuns, blocksToDocxParagraphs } from "../docxContent";
import type { MarkdownBlock } from "../markdownParser";

describe("textToRuns", () => {
  it("returns a single plain TextRun when there are no brackets", () => {
    const runs = textToRuns("Hello world");
    expect(runs).toHaveLength(1);
    expect(runs[0]).toBeInstanceOf(TextRun);
  });

  it("returns a single italic TextRun for fully-bracketed text", () => {
    const runs = textToRuns("[Placeholder text]");
    expect(runs).toHaveLength(1);
    expect(runs[0]).toBeInstanceOf(TextRun);
  });

  it("splits inline placeholder into plain + italic + plain runs", () => {
    const runs = textToRuns("Focus: [Placeholder - specific skill focus]");
    expect(runs).toHaveLength(2);
    // First run: "Focus: " (plain)
    expect(runs[0]).toBeInstanceOf(TextRun);
    // Second run: "[Placeholder - specific skill focus]" (italic)
    expect(runs[1]).toBeInstanceOf(TextRun);
  });

  it("handles multiple inline placeholders", () => {
    const runs = textToRuns("Drill 1: [name] and Drill 2: [description]");
    // "Drill 1: " + "[name]" + " and Drill 2: " + "[description]"
    expect(runs).toHaveLength(4);
    runs.forEach((run) => expect(run).toBeInstanceOf(TextRun));
  });

  it("returns a single TextRun for empty string", () => {
    const runs = textToRuns("");
    expect(runs).toHaveLength(1);
    expect(runs[0]).toBeInstanceOf(TextRun);
  });

  it("handles text ending with a plain segment after placeholder", () => {
    const runs = textToRuns("[Start] then more text");
    expect(runs).toHaveLength(2);
    expect(runs[0]).toBeInstanceOf(TextRun);
    expect(runs[1]).toBeInstanceOf(TextRun);
  });
});

describe("blocksToDocxParagraphs", () => {
  it("returns empty array for empty input", () => {
    expect(blocksToDocxParagraphs([])).toEqual([]);
  });

  it("returns one Paragraph per heading block", () => {
    const blocks: MarkdownBlock[] = [
      { type: "heading", level: 1, text: "Title" },
      { type: "heading", level: 2, text: "Section" },
      { type: "heading", level: 3, text: "Sub" },
    ];
    const paragraphs = blocksToDocxParagraphs(blocks);
    expect(paragraphs).toHaveLength(3);
  });

  it("returns one Paragraph per paragraph block", () => {
    const blocks: MarkdownBlock[] = [
      { type: "paragraph", text: "Some plain text." },
      { type: "paragraph", text: "Another paragraph." },
    ];
    const paragraphs = blocksToDocxParagraphs(blocks);
    expect(paragraphs).toHaveLength(2);
  });

  it("returns one Paragraph per bullet block", () => {
    const blocks: MarkdownBlock[] = [
      { type: "bullet", text: "Item one" },
      { type: "bullet", text: "Item two" },
    ];
    const paragraphs = blocksToDocxParagraphs(blocks);
    expect(paragraphs).toHaveLength(2);
  });

  it("handles mixed content and returns correct count", () => {
    const blocks: MarkdownBlock[] = [
      { type: "heading", level: 2, text: "Section" },
      { type: "paragraph", text: "Focus: [Placeholder]" },
      { type: "bullet", text: "A bullet" },
    ];
    const paragraphs = blocksToDocxParagraphs(blocks);
    expect(paragraphs).toHaveLength(3);
  });
});
