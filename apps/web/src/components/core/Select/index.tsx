import styles from "./index.module.css";
import type { SelectProps } from "./index.types";
import { SelectPanel } from "./SelectPanel";
import { SelectTrigger } from "./SelectTrigger";
import { useSelect } from "./use-select";

/** Styled listbox select for filter dropdowns. */
export function Select(props: SelectProps) {
  const {
    activeIndex,
    activeOptionId,
    ariaLabel,
    clearLabel,
    disabled,
    displayLabel,
    entries,
    handleClear,
    handleListClick,
    handleListFocus,
    handleListKeyDown,
    handleListMouseDown,
    handleListMouseOver,
    handleSearchChange,
    handleSearchKeyDown,
    handleTriggerClick,
    handleTriggerKeyDown,
    id,
    listId,
    open,
    query,
    rootRef,
    searchable,
    searchPlaceholder,
    searchRef,
    showClear,
    showingPlaceholder,
    value,
  } = useSelect(props);

  return (
    <div className={styles.root} ref={rootRef}>
      <SelectTrigger
        activeOptionId={activeOptionId}
        ariaLabel={ariaLabel}
        clearLabel={clearLabel}
        disabled={disabled}
        displayLabel={displayLabel}
        id={id}
        listId={listId}
        onClear={handleClear}
        onTriggerClick={handleTriggerClick}
        onTriggerKeyDown={handleTriggerKeyDown}
        open={open}
        searchable={searchable}
        showClear={showClear}
        showingPlaceholder={showingPlaceholder}
      />

      {open ? (
        <SelectPanel
          activeIndex={activeIndex}
          activeOptionId={activeOptionId}
          entries={entries}
          listId={listId}
          onListClick={handleListClick}
          onListFocus={handleListFocus}
          onListKeyDown={handleListKeyDown}
          onListMouseDown={handleListMouseDown}
          onListMouseOver={handleListMouseOver}
          onSearchChange={handleSearchChange}
          onSearchKeyDown={handleSearchKeyDown}
          open={open}
          query={query}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          searchRef={searchRef}
          value={value}
        />
      ) : null}
    </div>
  );
}
