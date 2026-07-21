import fs from "node:fs";
import path from "node:path";

import { parseMarkdown } from "../markdownParser";
import type { MarkdownBlock } from "../markdownParser";

describe("parseMarkdown", () => {
  it("parses a heading 1", () => {
    const blocks = parseMarkdown("# My Title");
    expect(blocks).toEqual([{ type: "heading", level: 1, text: "My Title" }]);
  });

  it("parses a heading 2", () => {
    const blocks = parseMarkdown("## Section Heading");
    expect(blocks).toEqual([{ type: "heading", level: 2, text: "Section Heading" }]);
  });

  it("parses a heading 3", () => {
    const blocks = parseMarkdown("### Sub Heading");
    expect(blocks).toEqual([{ type: "heading", level: 3, text: "Sub Heading" }]);
  });

  it("parses a paragraph", () => {
    const blocks = parseMarkdown("Hello world");
    expect(blocks).toEqual([{ type: "paragraph", text: "Hello world" }]);
  });

  it("parses a standalone image", () => {
    expect(parseMarkdown("![Skills cycle](/images/skills.png)")).toEqual([
      { type: "image", alt: "Skills cycle", src: "/images/skills.png" },
    ]);
  });

  it("parses bullet items with dash", () => {
    const blocks = parseMarkdown("- Item one\n- Item two");
    expect(blocks).toEqual([
      { type: "bullet", text: "Item one" },
      { type: "bullet", text: "Item two" },
    ]);
  });

  it("parses bullet items with asterisk", () => {
    const blocks = parseMarkdown("* First\n* Second");
    expect(blocks).toEqual([
      { type: "bullet", text: "First" },
      { type: "bullet", text: "Second" },
    ]);
  });

  it("appends an indented continuation line to the previous bullet", () => {
    const blocks = parseMarkdown("- First line\n  continuation here");
    expect(blocks).toEqual([{ type: "bullet", text: "First line continuation here" }]);
  });

  it("appends multiple indented continuation lines to the same bullet", () => {
    const blocks = parseMarkdown("- Start\n  middle\n  end");
    expect(blocks).toEqual([{ type: "bullet", text: "Start middle end" }]);
  });

  it("does not treat a normal paragraph after a blank line as a bullet continuation", () => {
    const blocks = parseMarkdown("- Bullet\n\nParagraph");
    expect(blocks).toEqual([
      { type: "bullet", text: "Bullet" },
      { type: "paragraph", text: "Paragraph" },
    ]);
  });

  it("does not treat an unindented line after a bullet as a continuation", () => {
    const blocks = parseMarkdown("- Bullet\nNot continuation");
    expect(blocks).toEqual([
      { type: "bullet", text: "Bullet" },
      { type: "paragraph", text: "Not continuation" },
    ]);
  });

  it("parses mixed content", () => {
    const md = "## My Section\n\nSome paragraph text.\n\n- Bullet A\n- Bullet B";
    const blocks = parseMarkdown(md);
    expect(blocks).toEqual([
      { type: "heading", level: 2, text: "My Section" },
      { type: "paragraph", text: "Some paragraph text." },
      { type: "bullet", text: "Bullet A" },
      { type: "bullet", text: "Bullet B" },
    ]);
  });

  it("parses pipe tables with headers, alignment separators, and rows", () => {
    const md = [
      "| Phase | Focus |",
      "| :--- | ---: |",
      "| Early | Stance and skating |",
      "| Late | Game preparation |",
    ].join("\n");

    expect(parseMarkdown(md)).toEqual([
      {
        type: "table",
        headers: ["Phase", "Focus"],
        rows: [
          ["Early", "Stance and skating"],
          ["Late", "Game preparation"],
        ],
      },
    ]);
  });

  it("parses every season overview age-group table", () => {
    const markdown = fs.readFileSync(
      path.join(__dirname, "../../content/team-plan/season-overview.md"),
      "utf8"
    );
    const tables = parseMarkdown(markdown).filter(
      (block): block is Extract<MarkdownBlock, { type: "table" }> => block.type === "table"
    );

    expect(tables).toHaveLength(5);
    expect(tables.map((table) => table.headers)).toEqual([
      ["Season Phase / Focus Points", "Specific Skills & Techniques"],
      ["Season Phase / Focus Points", "Specific Skills"],
      ["Timeframe & Core Focus", "Specific Skills & Techniques (11U/12U)"],
      ["Timeframe & Core Focus", "Specific Skills & Techniques (13U/14U)"],
      ["Timeframe & Core Focus", "16U and Older Specific Skills and Techniques"],
    ]);
    expect(tables.every((table) => table.rows.length === 4)).toBe(true);
  });

  it("parses fill-in fields with an optional number of lines", () => {
    expect(parseMarkdown("[[FIELD:Game Notes|3]]")).toEqual([
      { type: "field", label: "Game Notes", lines: 3 },
    ]);
    expect(parseMarkdown("[[FIELD: Coach Notes ]]")).toEqual([
      { type: "field", label: "Coach Notes", lines: 1 },
    ]);
  });

  it("groups consecutive compact fill-in fields into four-column rows", () => {
    expect(parseMarkdown("[[FIELDS:Opponent|Venue]]\n[[FIELDS:Result|Goalie]]")).toEqual([
      {
        type: "fields",
        rows: [
          { left: "Opponent", right: "Venue" },
          { left: "Result", right: "Goalie" },
        ],
      },
    ]);
  });

  it("leaves malformed compact fill-in fields as normal text", () => {
    expect(parseMarkdown("[[FIELDS:Opponent]]")).toEqual([
      { type: "paragraph", text: "[[FIELDS:Opponent]]" },
    ]);
  });

  it("unescapes pipes inside table cells", () => {
    expect(
      parseMarkdown("| Skill | Detail |\n| --- | --- |\n| Saves | Glove \\| blocker |")
    ).toEqual([
      {
        type: "table",
        headers: ["Skill", "Detail"],
        rows: [["Saves", "Glove | blocker"]],
      },
    ]);
  });

  it("does not treat a pipe paragraph without a separator row as a table", () => {
    expect(parseMarkdown("A | sentence\nwith | pipes")).toEqual([
      { type: "paragraph", text: "A | sentence with | pipes" },
    ]);
  });

  it("merges consecutive non-blank lines into one paragraph", () => {
    const md = "Line one\nLine two\nLine three";
    const blocks = parseMarkdown(md);
    expect(blocks).toEqual([{ type: "paragraph", text: "Line one Line two Line three" }]);
  });

  it("returns empty array for empty string", () => {
    expect(parseMarkdown("")).toEqual([]);
  });

  it("ignores leading and trailing blank lines", () => {
    const blocks = parseMarkdown("\n\nSome text\n\n");
    expect(blocks).toEqual([{ type: "paragraph", text: "Some text" }]);
  });

  it("skips complete single-line HTML comment lines (e.g. markdownlint-disable directives)", () => {
    const md = "<!-- markdownlint-disable MD041 -->\n## Section\n\nParagraph";
    const blocks = parseMarkdown(md);
    expect(blocks).toEqual([
      { type: "heading", level: 2, text: "Section" },
      { type: "paragraph", text: "Paragraph" },
    ]);
  });

  it("does not skip lines that start with <!-- but are not complete comments", () => {
    const md = "<!-- multi-line start\nsome content -->\n\n- Bullet";
    const blocks = parseMarkdown(md);
    // The opening line is not a complete comment so it becomes a paragraph
    // (the closing line "some content -->" also becomes part of a paragraph)
    const bulletBlock = blocks.find((b) => b.type === "bullet");
    expect(bulletBlock).toEqual({ type: "bullet", text: "Bullet" });
  });
});
