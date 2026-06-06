import {
  drillMarkdownToPlainLines,
  parseDrillMarkdown,
  parseDrillStepsMarkdown,
} from "../drillMarkdown";

describe("drillMarkdown list depth + style behavior", () => {
  it("preserves ordered and unordered nesting for drill steps up to 3 levels", () => {
    const blocks = parseDrillStepsMarkdown(
      `1. Step one
  1. Substep one
    - Detail bullet`
    );

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: "list",
      ordered: true,
      items: [
        {
          text: "Step one",
          children: [
            {
              type: "list",
              ordered: true,
              items: [
                {
                  text: "Substep one",
                  children: [
                    {
                      type: "list",
                      ordered: false,
                      items: [{ text: "Detail bullet", children: [] }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("caps nested lists at 3 levels and folds deeper items into level-3 text", () => {
    const blocks = parseDrillMarkdown(
      `- Level 1
  - Level 2
    - Level 3
      - Level 4 too deep
        - Level 5 too deep`
    );

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: "list",
      ordered: false,
      items: [
        {
          text: "Level 1",
          children: [
            {
              type: "list",
              ordered: false,
              items: [
                {
                  text: "Level 2",
                  children: [
                    {
                      type: "list",
                      ordered: false,
                      items: [{ text: "Level 3 Level 4 too deep Level 5 too deep", children: [] }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("keeps indentation and list markers for mixed 3-level lists in plain lines", () => {
    const lines = drillMarkdownToPlainLines(
      `1. Step one
  1. Substep one
    - Detail`
    );

    expect(lines).toEqual(["1. Step one", "  1. Substep one", "    • Detail"]);
  });
});
