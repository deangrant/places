import type {
  ChangeEvent as ReactChangeEvent,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
} from "react";
import type { SelectOption } from "../index.types";

/**
 * Props for the open Select panel (search + listbox).
 */
export interface SelectPanelProps {
  /** Highlighted option index within `entries`. */
  activeIndex: number;
  /** Id of the highlighted option for `aria-activedescendant`. */
  activeOptionId: string | undefined;
  /** Options currently shown in the listbox. */
  entries: SelectOption[];
  /** Listbox id. */
  listId: string;
  /** Chooses an option from a list click. */
  onListClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** Updates active index from option focus. */
  onListFocus: (event: ReactFocusEvent<HTMLDivElement>) => void;
  /** Chooses an option from list keyboard activation. */
  onListKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  /** Prevents focus steal on option mousedown. */
  onListMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** Updates active index from option hover. */
  onListMouseOver: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** Updates the filter query. */
  onSearchChange: (event: ReactChangeEvent<HTMLInputElement>) => void;
  /** Navigates or selects from the search field. */
  onSearchKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  /** Whether the menu is open (always true while mounted). */
  open: boolean;
  /** Filter query when searchable. */
  query: string;
  /** Whether the select supports type-to-filter. */
  searchable: boolean;
  /** Search field placeholder / aria-label. */
  searchPlaceholder: string;
  /** Search input ref for autofocus. */
  searchRef: RefObject<HTMLInputElement | null>;
  /** Controlled selected value. */
  value: string;
}
