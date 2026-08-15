import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/core/Modal";

afterEach(() => {
  cleanup();
});

describe("Modal", () => {
  it("restores focus to the previously focused element when closed", () => {
    const onClose = vi.fn();
    function Harness({ open }: { open: boolean }) {
      return (
        <>
          <button type="button">Outside</button>
          <Modal onClose={onClose} open={open} title="Confirm">
            <button type="button">Inside</button>
          </Modal>
        </>
      );
    }

    const { rerender } = render(<Harness open={false} />);
    const outside = screen.getByRole("button", { name: "Outside" });
    outside.focus();
    expect(document.activeElement).toBe(outside);

    rerender(<Harness open />);
    expect(screen.getByRole("dialog", { name: "Confirm" })).toBeVisible();

    rerender(<Harness open={false} />);
    expect(document.activeElement).toBe(outside);
  });
});
