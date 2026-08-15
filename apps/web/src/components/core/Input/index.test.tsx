import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "@/components/core/Input";

afterEach(() => {
  cleanup();
});

function ControlledInput({
  clearable = false,
  clearLabel,
  initial = "",
  onChange = vi.fn(),
}: {
  clearable?: boolean;
  clearLabel?: string;
  initial?: string;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Input
      clearable={clearable}
      clearLabel={clearLabel}
      id="demo"
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      placeholder="Type here"
      value={value}
    />
  );
}

describe("Input", () => {
  it("omits the clear control when empty or not clearable", () => {
    const { rerender } = render(<ControlledInput clearable />);
    expect(
      screen.queryByRole("button", { name: "Clear" }),
    ).not.toBeInTheDocument();

    rerender(<ControlledInput clearable={false} initial="hi" />);
    expect(
      screen.queryByRole("button", { name: "Clear" }),
    ).not.toBeInTheDocument();
  });

  it("clears the value when the clear control is pressed", () => {
    const onChange = vi.fn();
    render(
      <ControlledInput
        clearable
        clearLabel="Clear brand"
        initial="Starbucks"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear brand" }));
    expect(onChange).toHaveBeenCalledWith("");
    expect(screen.getByPlaceholderText("Type here")).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: "Clear brand" }),
    ).not.toBeInTheDocument();
  });
});
