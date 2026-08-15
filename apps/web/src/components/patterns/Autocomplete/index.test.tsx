import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Autocomplete } from "@/components/patterns/Autocomplete";

afterEach(() => {
  cleanup();
});

function ControlledAutocomplete({
  suggestions = ["Starbucks", "Costa"],
  onSelect = vi.fn(),
}: {
  onSelect?: (value: string) => void;
  suggestions?: string[];
}) {
  const [value, setValue] = useState("");
  return (
    <Autocomplete
      id="brand"
      onChange={setValue}
      onSelect={onSelect}
      placeholder="Brand"
      suggestions={suggestions}
      value={value}
    />
  );
}

describe("Autocomplete", () => {
  it("closes the listbox on blur", () => {
    render(<ControlledAutocomplete />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "S" } });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.blur(input);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects a suggestion on click without losing the selection to blur", () => {
    const onSelect = vi.fn();
    render(<ControlledAutocomplete onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "S" } });

    const option = screen.getByRole("option", { name: "Starbucks" });
    fireEvent.mouseDown(option);
    fireEvent.click(option);

    expect(onSelect).toHaveBeenCalledWith("Starbucks");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes the listbox on Escape", () => {
    render(<ControlledAutocomplete />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "S" } });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
