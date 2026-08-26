import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaginationFooter } from "@/components/shared/pagination-footer";

describe("PaginationFooter", () => {
  it("renders page 2 of 5 with all controls enabled", () => {
    render(
      <PaginationFooter page={2} totalPages={5} onPageChange={vi.fn()} />,
    );
    expect(screen.getByText("Page 2 of 5")).toBeTruthy();
  });

  it("page=1: first+prev disabled, next+last enabled", () => {
    const { container } = render(
      <PaginationFooter page={1} totalPages={5} onPageChange={vi.fn()} />,
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons[0].disabled).toBe(true); // first
    expect(buttons[1].disabled).toBe(true); // prev
    expect(buttons[2].disabled).toBe(false); // next
    expect(buttons[3].disabled).toBe(false); // last
  });

  it("page=totalPages: next+last disabled", () => {
    const { container } = render(
      <PaginationFooter page={5} totalPages={5} onPageChange={vi.fn()} />,
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons[0].disabled).toBe(false); // first
    expect(buttons[1].disabled).toBe(false); // prev
    expect(buttons[2].disabled).toBe(true); // next
    expect(buttons[3].disabled).toBe(true); // last
  });

  it("totalPages=0: all disabled, readout shows '--'", () => {
    render(
      <PaginationFooter page={1} totalPages={0} onPageChange={vi.fn()} />,
    );
    expect(screen.getByText("Page 1 of --")).toBeTruthy();
  });

  it("NaN totalPages: all disabled, no crash", () => {
    render(
      <PaginationFooter
        page={1}
        totalPages={Number.NaN}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Page 1 of --")).toBeTruthy();
  });

  it("clicking next fires onPageChange(page+1)", () => {
    const onChange = vi.fn();
    const { container } = render(
      <PaginationFooter page={2} totalPages={5} onPageChange={onChange} />,
    );
    const buttons = container.querySelectorAll("button");
    fireEvent.click(buttons[2]); // next
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("clicking prev fires onPageChange(page-1)", () => {
    const onChange = vi.fn();
    const { container } = render(
      <PaginationFooter page={3} totalPages={5} onPageChange={onChange} />,
    );
    const buttons = container.querySelectorAll("button");
    fireEvent.click(buttons[1]); // prev
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("clicking first fires onPageChange(1)", () => {
    const onChange = vi.fn();
    const { container } = render(
      <PaginationFooter page={3} totalPages={5} onPageChange={onChange} />,
    );
    const buttons = container.querySelectorAll("button");
    fireEvent.click(buttons[0]); // first
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("clicking last fires onPageChange(totalPages)", () => {
    const onChange = vi.fn();
    const { container } = render(
      <PaginationFooter page={2} totalPages={5} onPageChange={onChange} />,
    );
    const buttons = container.querySelectorAll("button");
    fireEvent.click(buttons[3]); // last
    expect(onChange).toHaveBeenCalledWith(5);
  });
});
