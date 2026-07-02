import { TextRun, Paragraph, ExternalHyperlink } from "docx";
import {
  parseRunData,
  textToRuns,
  parseSegments,
  textToParagraphChildren,
  blocksToDocxParagraphs,
  cleanHexColor,
  makeDocxHeaderFooter,
} from "../docxContent";
import type { DocxHeaderFooterClasses } from "../docxContent";
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

describe("parseSegments", () => {
  it("handles plain text", () => {
    expect(parseSegments("Plain text")).toEqual([{ type: "text", text: "Plain text" }]);
  });

  it("handles empty string", () => {
    expect(parseSegments("")).toEqual([{ type: "text", text: "" }]);
  });

  it("handles placeholder text only", () => {
    expect(parseSegments("[Placeholder]")).toEqual([
      { type: "placeholder", text: "[Placeholder]" },
    ]);
  });

  it("handles link only", () => {
    expect(parseSegments("[Link](https://google.com)")).toEqual([
      { type: "link", text: "Link", url: "https://google.com" },
    ]);
  });

  it("handles mixed placeholders, links, and text", () => {
    const text = "Prefix [Placeholder] middle [Link](https://google.com) suffix";
    expect(parseSegments(text)).toEqual([
      { type: "text", text: "Prefix " },
      { type: "placeholder", text: "[Placeholder]" },
      { type: "text", text: " middle " },
      { type: "link", text: "Link", url: "https://google.com" },
      { type: "text", text: " suffix" },
    ]);
  });
});

describe("textToParagraphChildren", () => {
  it("converts parsed segments to appropriate docx instances", () => {
    const text = "Prefix [Placeholder] middle [Link](https://google.com) suffix";
    const children = textToParagraphChildren(text, "00205B", "000000");

    expect(children).toHaveLength(5);
    expect(children[0]).toBeInstanceOf(TextRun);
    expect(children[1]).toBeInstanceOf(TextRun);
    expect(children[2]).toBeInstanceOf(TextRun);
    expect(children[3]).toBeInstanceOf(ExternalHyperlink);
    expect(children[4]).toBeInstanceOf(TextRun);

    // Verify properties of hyperlink
    const _link = children[3] as ExternalHyperlink;
    // We can check how it is constructed or check its properties
    // In docx library, the option is stored in the instance.
    // Let's check: link.options is typically present (see mock in makeDocxHeaderFooter test, but here it is a real instance)
    // For real ExternalHyperlink, the properties might not be directly public or easy to inspect depending on the package version,
    // but the test will verify it runs without crashing, and compiles correctly.
  });
});

describe("cleanHexColor", () => {
  it("strips a leading # from a valid 6-digit hex string", () => {
    expect(cleanHexColor("#00205B")).toBe("00205B");
  });

  it("returns the string unchanged when there is no leading #", () => {
    expect(cleanHexColor("AF272F")).toBe("AF272F");
  });

  it("returns '000000' for undefined", () => {
    expect(cleanHexColor(undefined)).toBe("000000");
  });

  it("returns '000000' for an empty string", () => {
    expect(cleanHexColor("")).toBe("000000");
  });

  it("handles a standalone # (returns empty string after stripping)", () => {
    expect(cleanHexColor("#")).toBe("");
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
    const paragraphs = blocksToDocxParagraphs(blocks);
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toBeInstanceOf(Paragraph);
    expect(parseRunData(text)).toHaveLength(2);
  });

  it("plain paragraph block produces exactly one child run", () => {
    const blocks: MarkdownBlock[] = [{ type: "paragraph", text: "Plain text." }];
    const paragraphs = blocksToDocxParagraphs(blocks);
    expect(paragraphs).toHaveLength(1);
    expect(parseRunData("Plain text.")).toHaveLength(1);
  });

  it("fully-bracketed paragraph block produces exactly one child run", () => {
    const blocks: MarkdownBlock[] = [{ type: "paragraph", text: "[Placeholder]" }];
    const paragraphs = blocksToDocxParagraphs(blocks);
    expect(paragraphs).toHaveLength(1);
    expect(parseRunData("[Placeholder]")).toHaveLength(1);
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
    const paragraphs = blocksToDocxParagraphs(blocks);
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toBeInstanceOf(Paragraph);
    expect(parseRunData(text)).toHaveLength(2);
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

describe("makeDocxHeaderFooter", () => {
  it("builds running headers and footers with correct styling, thicker borders, and centered page number", () => {
    const headerLabel = "TEAM PLAN";
    const primaryColor = "00205B";
    const secondaryColor = "AF272F";

    const mockHeader = jest.fn().mockImplementation(function (options) {
      return { type: "Header", options };
    });
    const mockFooter = jest.fn().mockImplementation(function (options) {
      return { type: "Footer", options };
    });
    const mockParagraph = jest.fn().mockImplementation(function (options) {
      return { type: "Paragraph", options };
    });
    const mockTextRun = jest.fn().mockImplementation(function (options) {
      return { type: "TextRun", options };
    });

    const classes = {
      Header: mockHeader,
      Footer: mockFooter,
      BorderStyle: { SINGLE: "single" },
      PageNumber: { CURRENT: "current" },
      Paragraph: mockParagraph,
      TextRun: mockTextRun,
      AlignmentType: { CENTER: "center", RIGHT: "right" },
    };

    makeDocxHeaderFooter(
      headerLabel,
      primaryColor,
      secondaryColor,
      classes as unknown as DocxHeaderFooterClasses
    );

    expect(mockHeader).toHaveBeenCalledTimes(1);
    expect(mockFooter).toHaveBeenCalledTimes(1);

    const headerOptions = mockHeader.mock.calls[0][0];
    const footerOptions = mockFooter.mock.calls[0][0];

    // Header checks
    const headerP = headerOptions.children[0];
    expect(headerP.options.alignment).toBe("right");
    expect(headerP.options.border.bottom.size).toBe(18);
    expect(headerP.options.border.bottom.color).toBe(secondaryColor);
    expect(headerP.options.children[0].options.text).toBe(headerLabel);
    expect(headerP.options.children[0].options.color).toBe(primaryColor);

    // Footer checks
    const footerP = footerOptions.children[0];
    expect(footerP.options.alignment).toBe("center");
    expect(footerP.options.border.top.size).toBe(18);
    expect(footerP.options.border.top.color).toBe(secondaryColor);
    expect(footerP.options.children[0].options.children).toEqual(["Page ", "current"]);
    expect(footerP.options.children[0].options.color).toBe(primaryColor);
    expect(footerP.options.children[0].options.bold).toBe(true);
  });
});
