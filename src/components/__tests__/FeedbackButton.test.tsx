import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FeedbackButton from "../FeedbackButton";

describe("FeedbackButton", () => {
  it("renders a Contact Us trigger and opens support links in the modal", async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    await user.click(screen.getByRole("button", { name: "Contact Us" }));

    expect(screen.getByRole("heading", { name: "Contact Goalie Gen" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Report a Site Issue" })).toHaveAttribute(
      "href",
      "https://github.com/splk3/goalie-gen/issues/new?template=bug_report.yml"
    );
    expect(screen.getByRole("link", { name: "Request an Improvement" })).toHaveAttribute(
      "href",
      "https://github.com/splk3/goalie-gen/issues/new?template=feature_request.yml"
    );
    expect(screen.getByRole("link", { name: "Share a Drill Idea" })).toHaveAttribute(
      "href",
      "https://github.com/splk3/goalie-gen/issues/new?template=new-drill-template.yml"
    );
  });
});
