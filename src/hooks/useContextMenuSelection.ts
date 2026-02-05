import { useCallback } from 'react';

interface ListStore {
  selectedIds: (string | number)[];
  resetSelectedIds(): void;
  addSelectedId(id: string | number): void;
}

export function useContextMenuSelection(
  listStore: ListStore,
  itemId: string | number
): (open: boolean) => void {
  return useCallback(
    (open: boolean) => {
      if (open && !listStore.selectedIds.includes(itemId)) {
        listStore.resetSelectedIds();
        listStore.addSelectedId(itemId);
      }
    },
    [listStore, itemId]
  );
}
