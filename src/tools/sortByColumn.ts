type ColumnMap = Record<string, string>;
type SpecialHandler = (value: unknown) => unknown;
type SpecialHandlers = Record<string, SpecialHandler>;

interface Sortable {
  [key: string]: unknown;
}

/**
 * Creates a sorter function for sorting items by column
 */
export function createColumnSorter<T extends Sortable>(
  columnMap: ColumnMap = {},
  specialHandlers: SpecialHandlers = {}
) {
  return function sortByColumn(items: T[], sortBy: string, direction: 1 | -1): T[] {
    const byColumn = columnMap[sortBy] || sortBy;
    const result = items.slice(0);

    const upDown: [number, number] = [-1, 1];
    if (direction === 1) {
      upDown.reverse();
    }

    result.sort((aa, bb) => {
      let a = aa[byColumn];
      let b = bb[byColumn];
      const [up, down] = upDown;

      // Apply special handlers if defined for this column
      const handler = specialHandlers[byColumn];
      if (handler) {
        a = handler(a);
        b = handler(b);
      }

      if (a === b) {
        return 0;
      }
      // Handle null/undefined - push them to the end
      if (a == null) return down;
      if (b == null) return up;
      if (a > b) {
        return up;
      }
      return down;
    });

    return result;
  };
}

// Special handler for ETA column (-1 means infinite)
export const etaHandler: SpecialHandler = (value) => (value === -1 ? Infinity : value);

// Special handler for date columns (0/null/undefined means infinite)
export const dateHandler: SpecialHandler = (value) => (!value ? Infinity : value);

// Pre-configured sorter for torrents
export const torrentColumnMap: ColumnMap = {
  done: 'progress',
  downspd: 'downloadSpeed',
  upspd: 'uploadSpeed',
  upped: 'uploaded',
  added: 'addedTime',
  completed: 'completedTime',
  status: 'statusCode',
};

export const torrentSpecialHandlers: SpecialHandlers = {
  eta: etaHandler,
  addedTime: dateHandler,
  completedTime: dateHandler,
};

// Pre-configured sorter for files
export const fileColumnMap: ColumnMap = {
  done: 'progress',
  prio: 'priority',
};
