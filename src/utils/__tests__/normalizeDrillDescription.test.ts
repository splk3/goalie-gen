import { normalizeDrillDescription } from "../normalizeDrillDescription";

describe("normalizeDrillDescription", () => {
  it("converts single newlines into spaces", () => {
    const description = "Line one\nLine two\nLine three";

    expect(normalizeDrillDescription(description)).toBe("Line one Line two Line three");
  });

  it("preserves paragraph breaks created by consecutive newlines", () => {
    const description = "Paragraph one line one\nParagraph one line two\n\nParagraph two line one";

    expect(normalizeDrillDescription(description)).toBe(
      "Paragraph one line one Paragraph one line two\n\nParagraph two line one"
    );
  });

  it("handles windows line endings and trims around wrapped newlines", () => {
    const description = "First line  \r\n   second line\r\n\r\nthird line";

    expect(normalizeDrillDescription(description)).toBe("First line second line\n\nthird line");
  });
});
