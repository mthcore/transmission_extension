import {useCallback} from "react";

/**
 * Hook for handling dialog close action
 * @param {Object} dialogStore - The dialog store with close() method
 * @returns {Function} handleClose callback
 */
export function useDialogClose(dialogStore) {
  return useCallback((e) => {
    e && e.preventDefault();
    dialogStore.close();
  }, [dialogStore]);
}
