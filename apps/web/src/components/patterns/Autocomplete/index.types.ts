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
 * Props for one suggestion button in the Autocomplete menu.
 */
export interface SuggestionItemProps {
  /** Called with the suggestion text when activated. */
  onSelect: (suggestion: string) => void;
  /** Suggestion label rendered as the button text. */
  suggestion: string;
}
