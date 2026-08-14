/**
 * Props for the text input with suggestion dropdown.
 */
export interface AutocompleteProps {
  /** Disables input and suggestion interaction. */
  disabled?: boolean;
  /** Optional id forwarded to the underlying input. */
  id?: string;
  /** Called when the typed value changes. */
  onChange: (value: string) => void;
  /** Called when a suggestion is chosen. */
  onSelect: (value: string) => void;
  /** Placeholder shown when the value is empty. */
  placeholder?: string;
  /** Suggestion strings shown while the menu is open. */
  suggestions: string[];
  /** Controlled input value. */
  value: string;
}

/**
 * Props for one suggestion option in the Autocomplete listbox.
 */
export interface SuggestionItemProps {
  /** True when this option is the keyboard-highlighted active descendant. */
  active: boolean;
  /** DOM id used for `aria-activedescendant`. */
  id: string;
  /** Called with the suggestion text when activated. */
  onSelect: (suggestion: string) => void;
  /** Suggestion label rendered as the option text. */
  suggestion: string;
}
