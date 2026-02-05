import { useCallback } from 'react';

interface Column {
  toggleDisplay(): void;
}

export function useColumnToggle(saveColumns: () => void): (column: Column) => void {
  return useCallback(
    (column: Column) => {
      column.toggleDisplay();
      saveColumns();
    },
    [saveColumns]
  );
}
