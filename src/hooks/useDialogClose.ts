import { useCallback, type SyntheticEvent } from 'react';

interface DialogStore {
  close(): void;
}

export function useDialogClose(dialogStore: DialogStore): (e?: SyntheticEvent) => void {
  return useCallback(
    (e?: SyntheticEvent) => {
      e?.preventDefault();
      dialogStore.close();
    },
    [dialogStore]
  );
}
