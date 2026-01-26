/**
 * Creates a sorter function for sorting items by column
 * @param {Object} columnMap - Maps column names to property names
 * @param {Object} [specialHandlers] - Special value handlers for specific columns
 * @returns {function} Sorter function
 */
export function createColumnSorter(columnMap = {}, specialHandlers = {}) {
  return function sortByColumn(items, sortBy, direction) {
    const byColumn = columnMap[sortBy] || sortBy;
    const result = items.slice(0);

    const upDown = [-1, 1];
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
      if (a > b) {
        return up;
      }
      return down;
    });

    return result;
  };
}

// Special handler for ETA column (-1 means infinite)
export const etaHandler = (value) => value === -1 ? Infinity : value;

// Special handler for date columns (0/null/undefined means infinite)
export const dateHandler = (value) => !value ? Infinity : value;

// Pre-configured sorter for torrents
export const torrentColumnMap = {
  done: 'progress',
  downspd: 'downloadSpeed',
  upspd: 'uploadSpeed',
  upped: 'uploaded',
  added: 'addedTime',
  completed: 'completedTime',
  status: 'statusCode',
};

export const torrentSpecialHandlers = {
  eta: etaHandler,
  addedTime: dateHandler,
  completedTime: dateHandler,
};

// Pre-configured sorter for files
export const fileColumnMap = {
  done: 'progress',
  prio: 'priority',
};
