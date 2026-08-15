import styles from "../index.module.css";
import { optionId } from "../use-select";
import type { SelectPanelProps } from "./index.types";

/**
 * Renders the open Select panel with optional search and the option listbox.
 */
export function SelectPanel({
  activeIndex,
  activeOptionId,
  entries,
  listId,
  open,
  query,
  searchable,
  searchPlaceholder,
  searchRef,
  value,
  onListClick,
  onListFocus,
  onListKeyDown,
  onListMouseDown,
  onListMouseOver,
  onSearchChange,
  onSearchKeyDown,
}: SelectPanelProps) {
  return (
    <div className={styles.panel}>
      {searchable ? (
        <div className={styles.search}>
          <input
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            aria-label={searchPlaceholder}
            className={styles.searchInput}
            onChange={onSearchChange}
            onKeyDown={onSearchKeyDown}
            placeholder={searchPlaceholder}
            ref={searchRef}
            role="combobox"
            type="text"
            value={query}
          />
        </div>
      ) : null}
      <div
        className={styles.list}
        id={listId}
        onClick={onListClick}
        onFocus={onListFocus}
        onKeyDown={onListKeyDown}
        onMouseDown={onListMouseDown}
        onMouseOver={onListMouseOver}
        role="listbox"
      >
        {entries.length === 0 ? (
          <div className={styles.empty}>No matches</div>
        ) : (
          entries.map((entry, index) => {
            const selectedOption = entry.value === value;
            const active = index === activeIndex;
            return (
              <div
                aria-selected={selectedOption}
                className={[
                  styles.item,
                  active ? styles.itemActive : undefined,
                  selectedOption ? styles.itemSelected : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-option-index={index}
                data-option-value={entry.value}
                id={optionId(listId, index)}
                key={`${entry.value || "empty"}-${entry.label}`}
                role="option"
                tabIndex={-1}
              >
                {entry.label}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
