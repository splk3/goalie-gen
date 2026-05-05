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
  it("produces the same number of runs as parseRunData and returns TextRun instances", () => {
    const text = "Focus: [Placeholder]";
    const runs = textToRuns(text);
    expect(runs).toHaveLength(parseRunData(text).length);
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

  it("paragraph blocks produce one run per parsed segment (via parseRunData)", () => {
    const text = "Focus: [Placeholder]";
    const blocks: MarkdownBlock[] = [{ type: "paragraph", text }];
    const [para] = blocksToDocxParagraphs(blocks);
    expect(para).toBeInstanceOf(Paragraph);
    // The number of TextRun children should match parseRunData output
    expect(para.root.filter((n) => n instanceof TextRun)).toHaveLength(parseRunData(text).length);
  });

  it("plain paragraph block produces exactly one child run", () => {
    const blocks: MarkdownBlock[] = [{ type: "paragraph", text: "Plain text." }];
    const [para] = blocksToDocxParagraphs(blocks);
    expect(para.root.filter((n) => n instanceof TextRun)).toHaveLength(
      parseRunData("Plain text.").length
    );
  });

  it("fully-bracketed paragraph block produces exactly one child run", () => {
    const blocks: MarkdownBlock[] = [{ type: "paragraph", text: "[Placeholder]" }];
    const [para] = blocksToDocxParagraphs(blocks);
    expect(para.root.filter((n) => n instanceof TextRun)).toHaveLength(
      parseRunData("[Placeholder]").length
    );
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

  it("bullet blocks with placeholders produce multiple child runs (italic support)", () => {
    const text = "Drill: [placeholder drill name]";
    const blocks: MarkdownBlock[] = [{ type: "bullet", text }];
    const [para] = blocksToDocxParagraphs(blocks);
    expect(para).toBeInstanceOf(Paragraph);
    expect(para.root.filter((n) => n instanceof TextRun)).toHaveLength(parseRunData(text).length);
  });

  it("handles mixed content and returns the correct total count", () => {
    const blocks: MarkdownBlock[] = [
      { type: "heading", level: 2, text: "Section" },
      { type: "paragraph", text: "Focus: [Placeholder]" },
      { type: "bullet", text: "A bullet" },
    ];
    const paragraphs = blocksToDocxParagraphs(blocks);
    expect(paragraphs).toHaveLength(3);
  });
});
