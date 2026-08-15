import type { SelectOption } from "./index.types";

/**
 * Filters select options by case-insensitive substring on label or value.
 * @param options Source options.
 * @param query Raw filter text; empty returns all options.
 */
export function filterSelectOptions(
  options: SelectOption[],
  query: string,
): SelectOption[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return options;
  }
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(trimmed) ||
      option.value.toLowerCase().includes(trimmed),
  );
}
