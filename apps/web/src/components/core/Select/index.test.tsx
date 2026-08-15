import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Select } from "@/components/core/Select";

afterEach(() => {
  cleanup();
});

const OPTIONS = [
  { label: "Alpha", value: "a" },
  { label: "Beta", value: "b" },
];

function ControlledSelect({
  clearable,
  clearLabel,
  disabled,
  initial = "",
  onChange = vi.fn(),
}: {
  clearable?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  initial?: string;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Select
      clearable={clearable}
      clearLabel={clearLabel}
      disabled={disabled}
      id="demo"
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      options={OPTIONS}
      placeholder="Pick one"
      value={value}
    />
  );
}

describe("Select", () => {
  it("shows the placeholder until an option is chosen", () => {
    render(<ControlledSelect />);
    expect(
      screen.getByRole("button", { name: "Pick one" }),
    ).toBeInTheDocument();
  });

  it("opens the listbox and selects an option", () => {
    const onChange = vi.fn();
    render(<ControlledSelect onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Pick one" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Beta" }));

    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("button", { name: "Beta" })).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects with keyboard when open", () => {
    const onChange = vi.fn();
    render(<ControlledSelect onChange={onChange} />);
    const trigger = screen.getByRole("button", { name: "Pick one" });

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("does not open when disabled", () => {
    render(<ControlledSelect disabled />);
    const trigger = screen.getByRole("button", { name: "Pick one" });
    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<ControlledSelect />);
    const trigger = screen.getByRole("button", { name: "Pick one" });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("omits the clear control when empty or not clearable", () => {
    const { rerender } = render(<ControlledSelect clearable />);
    expect(
      screen.queryByRole("button", { name: "Clear" }),
    ).not.toBeInTheDocument();

    rerender(<ControlledSelect clearable={false} initial="b" />);
    expect(
      screen.queryByRole("button", { name: "Clear" }),
    ).not.toBeInTheDocument();
  });

  it("clears the value without leaving the menu open", () => {
    const onChange = vi.fn();
    render(
      <ControlledSelect
        clearable
        clearLabel="Clear country"
        initial="b"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Beta" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear country" }));
    expect(onChange).toHaveBeenCalledWith("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pick one" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear country" }),
    ).not.toBeInTheDocument();
  });
});
