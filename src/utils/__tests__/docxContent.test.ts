import { TextRun, Paragraph } from "docx";
import { parseRunData, textToRuns, blocksToDocxParagraphs } from "../docxContent";
import type { MarkdownBlock } from "../markdownParser";

describe("parseRunData", () => {
  it("returns a single plain run when there are no brackets", () => {
    const runs = parseRunData("Hello world");
    expect(runs).toEqual([{ text: "Hello world", italics: false }]);
  });

  it("returns a single italic run for fully-bracketed text", () => {
    const runs = parseRunData("[Placeholder text]");
    expect(runs).toEqual([{ text: "[Placeholder text]", italics: true }]);
  });

  it("splits an inline placeholder into correct plain and italic runs", () => {
    const runs = parseRunData("Focus: [Placeholder - specific skill focus]");
    expect(runs).toEqual([
      { text: "Focus: ", italics: false },
      { text: "[Placeholder - specific skill focus]", italics: true },
    ]);
  });

  it("handles multiple inline placeholders in one string", () => {
    const runs = parseRunData("Drill 1: [name] and Drill 2: [description]");
    expect(runs).toEqual([
      { text: "Drill 1: ", italics: false },
      { text: "[name]", italics: true },
      { text: " and Drill 2: ", italics: false },
      { text: "[description]", italics: true },
    ]);
  });

  it("returns a single plain run for empty string", () => {
    const runs = parseRunData("");
    expect(runs).toEqual([{ text: "", italics: false }]);
  });

  it("handles a placeholder at the start of the string", () => {
    const runs = parseRunData("[Start] then more text");
    expect(runs).toEqual([
      { text: "[Start]", italics: true },
      { text: " then more text", italics: false },
    ]);
  });

  it("handles adjacent placeholders without intervening text", () => {
    const runs = parseRunData("[A][B]");
    expect(runs).toEqual([
      { text: "[A]", italics: true },
      { text: "[B]", italics: true },
    ]);
  });
});

describe("textToRuns", () => {
  it("returns TextRun instances matching parseRunData output", () => {
    const runs = textToRuns("Focus: [Placeholder]");
    expect(runs).toHaveLength(2);
    runs.forEach((run) => expect(run).toBeInstanceOf(TextRun));
  });

  it("returns a single TextRun for plain text", () => {
    const runs = textToRuns("No brackets here");
    expect(runs).toHaveLength(1);
    expect(runs[0]).toBeInstanceOf(TextRun);
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
    paragraphs.forEach((p) => expect(p).toBeInstanceOf(Paragraph));
  });

  it("paragraph blocks use textToRuns so inline placeholders get italic runs", () => {
    const blocks: MarkdownBlock[] = [
      { type: "paragraph", text: "Focus: [Placeholder]" },
    ];
    const [para] = blocksToDocxParagraphs(blocks);
    expect(para).toBeInstanceOf(Paragraph);
    // The paragraph's children should match textToRuns output for "Focus: [Placeholder]"
    const expectedRunCount = textToRuns("Focus: [Placeholder]").length;
    // Verify children are TextRun instances with the right count
    const textRuns = para.root.filter((n) => n instanceof TextRun);
    expect(textRuns).toHaveLength(expectedRunCount);
  });

  it("plain paragraph block produces a single child TextRun", () => {
    const blocks: MarkdownBlock[] = [{ type: "paragraph", text: "Plain text." }];
    const [para] = blocksToDocxParagraphs(blocks);
    const textRuns = para.root.filter((n) => n instanceof TextRun);
    expect(textRuns).toHaveLength(1);
  });

  it("fully-bracketed paragraph block produces a single italic child TextRun", () => {
    const blocks: MarkdownBlock[] = [{ type: "paragraph", text: "[Placeholder]" }];
    const [para] = blocksToDocxParagraphs(blocks);
    const textRuns = para.root.filter((n) => n instanceof TextRun);
    expect(textRuns).toHaveLength(1);
  });

  it("returns one Paragraph per bullet block", () => {
    const blocks: MarkdownBlock[] = [
      { type: "bullet", text: "Item one" },
      { type: "bullet", text: "Item two" },
    ];
    const paragraphs = blocksToDocxParagraphs(blocks);
    expect(paragraphs).toHaveLength(2);
    paragraphs.forEach((p) => expect(p).toBeInstanceOf(Paragraph));
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
