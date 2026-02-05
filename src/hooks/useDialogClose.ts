import { useCallback } from 'react';

interface DialogStore {
  close(): void;
}

export function useDialogClose(dialogStore: DialogStore): (e?: React.SyntheticEvent) => void {
  return useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault();
      dialogStore.close();
    },
    [dialogStore]
  );
}
