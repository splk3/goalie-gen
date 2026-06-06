import * as React from "react";
import { render } from "@testing-library/react";
import DrillMarkdown from "../DrillMarkdown";

describe("DrillMarkdown", () => {
  it("adds progressively deeper indentation classes for nested lists", () => {
    const { container } = render(
      <DrillMarkdown
        markdown={`- Top level
  - Second level
    - Third level`}
      />
    );

    const unorderedLists = container.querySelectorAll("ul");
    expect(unorderedLists).toHaveLength(3);
    expect(unorderedLists[0]).toHaveClass("pl-5");
    expect(unorderedLists[1]).toHaveClass("pl-8");
    expect(unorderedLists[2]).toHaveClass("pl-11");
    expect(unorderedLists[0]).toHaveClass("print:pl-6");
    expect(unorderedLists[1]).toHaveClass("print:pl-12");
    expect(unorderedLists[2]).toHaveClass("print:pl-16");
  });
});
