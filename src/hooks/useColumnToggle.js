import {useCallback} from "react";

/**
 * Hook for handling column visibility toggle
 * @param {Function} saveColumns - Function to save columns state (e.g., config.saveTorrentsColumns)
 * @returns {Function} handleToggleColumn callback
 */
export function useColumnToggle(saveColumns) {
  return useCallback((column) => {
    column.toggleDisplay();
    saveColumns();
  }, [saveColumns]);
}
