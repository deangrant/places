import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useCallback, useState } from "react";
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
  searchable,
}: {
  clearable?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  initial?: string;
  onChange?: (value: string) => void;
  searchable?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const handleChange = useCallback(
    (next: string) => {
      setValue(next);
      onChange(next);
    },
    [onChange],
  );
  return (
    <Select
      aria-label="Demo select"
      clearable={clearable}
      clearLabel={clearLabel}
      disabled={disabled}
      id="demo"
      onChange={handleChange}
      options={OPTIONS}
      placeholder="Pick one"
      searchable={searchable}
      value={value}
    />
  );
}

describe("Select", () => {
  it("shows the placeholder until an option is chosen", () => {
    render(<ControlledSelect />);
    expect(
      screen.getByRole("combobox", { name: "Demo select" }),
    ).toHaveTextContent("Pick one");
  });

  it("opens the listbox and selects an option", () => {
    const onChange = vi.fn();
    render(<ControlledSelect onChange={onChange} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Demo select" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Beta" }));

    expect(onChange).toHaveBeenCalledWith("b");
    expect(
      screen.getByRole("combobox", { name: "Demo select" }),
    ).toHaveTextContent("Beta");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects with keyboard when open", () => {
    const onChange = vi.fn();
    render(<ControlledSelect onChange={onChange} />);
    const trigger = screen.getByRole("combobox", { name: "Demo select" });

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("does not open when disabled", () => {
    render(<ControlledSelect disabled />);
    const trigger = screen.getByRole("combobox", { name: "Demo select" });
    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<ControlledSelect />);
    const trigger = screen.getByRole("combobox", { name: "Demo select" });
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

    fireEvent.click(screen.getByRole("combobox", { name: "Demo select" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear country" }));
    expect(onChange).toHaveBeenCalledWith("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Demo select" }),
    ).toHaveTextContent("Pick one");
    expect(
      screen.queryByRole("button", { name: "Clear country" }),
    ).not.toBeInTheDocument();
  });

  it("filters options by label when searchable", () => {
    render(<ControlledSelect searchable />);
    fireEvent.click(screen.getByRole("combobox", { name: "Demo select" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Filter…" }), {
      target: { value: "bet" },
    });
    expect(screen.getByRole("option", { name: "Beta" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Alpha" }),
    ).not.toBeInTheDocument();
  });

  it("filters options by value when searchable", () => {
    function CodeSelect() {
      const [value, setValue] = useState("");
      return (
        <Select
          aria-label="Demo select"
          id="demo-code"
          onChange={setValue}
          options={[
            { label: "South Africa", value: "ZA" },
            { label: "United States", value: "US" },
          ]}
          placeholder="Pick one"
          searchable
          value={value}
        />
      );
    }
    render(<CodeSelect />);
    fireEvent.click(screen.getByRole("combobox", { name: "Demo select" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Filter…" }), {
      target: { value: "za" },
    });
    expect(
      screen.getByRole("option", { name: "South Africa" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "United States" }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", () => {
    render(<ControlledSelect searchable />);
    fireEvent.click(screen.getByRole("combobox", { name: "Demo select" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Filter…" }), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});
