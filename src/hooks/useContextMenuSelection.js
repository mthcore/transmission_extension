import {useCallback} from "react";

/**
 * Hook for handling context menu selection on right-click
 * Selects item if not already selected, keeps selection for bulk actions otherwise
 * @param {Object} listStore - The list store with selectedIds, resetSelectedIds, addSelectedId
 * @param {string|number} itemId - The item ID to potentially select
 * @returns {Function} handleOpenChange callback for ContextMenu.Root
 */
export function useContextMenuSelection(listStore, itemId) {
  return useCallback((open) => {
    if (open && !listStore.selectedIds.includes(itemId)) {
      listStore.resetSelectedIds();
      listStore.addSelectedId(itemId);
    }
  }, [listStore, itemId]);
}
