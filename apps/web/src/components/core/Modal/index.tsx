import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./index.module.css";
import type { ModalProps } from "./index.types";

/** Accessible dialog overlay for short confirmation and option flows. */
export function Modal({
  open,
  onClose,
  title,
  titleId,
  children,
  closeOnEscape = true,
  closeOnBackdrop = true,
  showCloseButton = true,
}: ModalProps) {
  const generatedTitleId = useId();
  const resolvedTitleId = titleId ?? generatedTitleId;
  const dialogRef = useRef(null as HTMLDialogElement | null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open) {
      if (!dialog.open) {
        previouslyFocusedRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        // jsdom lacks HTMLDialogElement.showModal; attribute open is enough there.
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      }
      return;
    }

    if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
    const previouslyFocused = previouslyFocusedRef.current;
    previouslyFocusedRef.current = null;
    previouslyFocused?.focus();
  }, [open]);

  const handleCancel = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      // Keep dismiss controlled by props / parent state.
      event.preventDefault();
      if (closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose],
  );

  return createPortal(
    <dialog
      aria-labelledby={resolvedTitleId}
      className={styles.dialog}
      onCancel={handleCancel}
      ref={dialogRef}
    >
      {closeOnBackdrop ? (
        <button
          aria-label="Close dialog"
          className={styles.backdrop}
          onClick={onClose}
          type="button"
        />
      ) : null}
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title} id={resolvedTitleId}>
            {title}
          </h2>
          {showCloseButton ? (
            <button
              aria-label="Close"
              className={styles.close}
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>,
    document.body,
  );
}
