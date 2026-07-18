import { parseInlineMarkdown } from "../inlineMarkdown";

describe("parseInlineMarkdown", () => {
  it("parses both standard bold marker forms", () => {
    expect(parseInlineMarkdown("**bold** and __also bold__")).toEqual([
      { type: "text", text: "bold", bold: true },
      { type: "text", text: " and " },
      { type: "text", text: "also bold", bold: true },
    ]);
  });

  it("parses both standard italic marker forms", () => {
    expect(parseInlineMarkdown("*italic* and _also italic_")).toEqual([
      { type: "text", text: "italic", italics: true },
      { type: "text", text: " and " },
      { type: "text", text: "also italic", italics: true },
    ]);
  });

  it("combines nested bold and italic styles", () => {
    expect(parseInlineMarkdown("**bold _and italic_**")).toEqual([
      { type: "text", text: "bold ", bold: true },
      { type: "text", text: "and italic", bold: true, italics: true },
    ]);
  });

  it("preserves placeholder italics and link metadata", () => {
    expect(parseInlineMarkdown("[Placeholder] [Guide](https://example.com)")).toEqual([
      { type: "placeholder", text: "[Placeholder]" },
      { type: "text", text: " " },
      { type: "link", text: "Guide", url: "https://example.com" },
    ]);
  });

  it("leaves unmatched markers literal", () => {
    expect(parseInlineMarkdown("Use **bold carefully")).toEqual([
      { type: "text", text: "Use **bold carefully" },
    ]);
  });
});
