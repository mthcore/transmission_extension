import type { ColumnConfig } from '../types';

function mergeColumns(columns: ColumnConfig[], defColumns: ColumnConfig[]): ColumnConfig[] {
  const defIdIndex: Record<string, number> = {};

  const defIdColumn = defColumns.reduce(
    (result, item, index) => {
      defIdIndex[item.column] = index;
      result[item.column] = item;
      return result;
    },
    {} as Record<string, ColumnConfig>
  );

  const removedIds = Object.keys(defIdColumn);
  const unknownColumns: ColumnConfig[] = [];

  columns.forEach((column) => {
    const id = column.column;

    const pos = removedIds.indexOf(id);
    if (pos !== -1) {
      removedIds.splice(pos, 1);
    } else {
      unknownColumns.push(column);
    }

    const normColumn = { ...defIdColumn[id], ...column };
    Object.assign(column, normColumn);
  });

  removedIds.forEach((id) => {
    const column = { ...defIdColumn[id] };
    columns.splice(defIdIndex[id], 0, column);
  });

  unknownColumns.forEach((column) => {
    const pos = columns.indexOf(column);
    if (pos !== -1) {
      columns.splice(pos, 1);
    }
  });

  return columns;
}

export default mergeColumns;
