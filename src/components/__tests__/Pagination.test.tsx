import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "../Pagination";

describe("Pagination", () => {
  const onPageChangeMock = jest.fn();

  beforeEach(() => {
    onPageChangeMock.mockClear();
  });

  it("renders nothing if totalPages is 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={onPageChangeMock} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing if totalPages is 0", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} onPageChange={onPageChangeMock} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders correct page information", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChangeMock} />);
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  });

  it("disables the previous button on the first page and does not call onPageChange", async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChangeMock} />);
    const prevButton = screen.getByRole("button", { name: /previous page/i });
    expect(prevButton).toBeDisabled();
    await user.click(prevButton);
    expect(onPageChangeMock).not.toHaveBeenCalled();
  });

  it("disables the next button on the last page and does not call onPageChange", async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={5} totalPages={5} onPageChange={onPageChangeMock} />);
    const nextButton = screen.getByRole("button", { name: /next page/i });
    expect(nextButton).toBeDisabled();
    await user.click(nextButton);
    expect(onPageChangeMock).not.toHaveBeenCalled();
  });

  it("enables both buttons on middle pages", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChangeMock} />);
    const prevButton = screen.getByRole("button", { name: /previous page/i });
    const nextButton = screen.getByRole("button", { name: /next page/i });
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it("calls onPageChange with the previous page when previous is clicked", async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChangeMock} />);
    const prevButton = screen.getByRole("button", { name: /previous page/i });
    await user.click(prevButton);
    expect(onPageChangeMock).toHaveBeenCalledWith(1);
  });

  it("calls onPageChange with the next page when next is clicked", async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChangeMock} />);
    const nextButton = screen.getByRole("button", { name: /next page/i });
    await user.click(nextButton);
    expect(onPageChangeMock).toHaveBeenCalledWith(3);
  });

  it("does not call onPageChange when currentPage exceeds totalPages and next is clicked", async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={6} totalPages={5} onPageChange={onPageChangeMock} />);
    const nextButton = screen.getByRole("button", { name: /next page/i });
    // The next button is not disabled (uses strict equality: currentPage === totalPages),
    // but the internal guard prevents onPageChange from being called.
    expect(nextButton).not.toBeDisabled();
    await user.click(nextButton);
    expect(onPageChangeMock).not.toHaveBeenCalled();
  });
});
