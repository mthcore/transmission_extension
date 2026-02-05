// Types only - the class has been replaced by useTableHeadColumn hook

interface Column {
  column: string;
  width: number;
  lang: string;
  order: number;
  display: boolean;
  setWidth: (width: number) => void;
}

interface TableHeadColumnProps {
  column: Column;
  isSorted: boolean;
  sortDirection: number;
  onMoveColumn: (from: string, to: string) => void;
  onSort: (column: string, direction: number) => void;
  onSaveColumns: () => void;
  withStyle?: boolean;
}

export type { TableHeadColumnProps, Column };
