import React, { useRef, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Column } from './TableHeadColumn';
import TorrentListTableItem from './TorrentListTableItem';
import ColumnContextMenu from './ColumnContextMenu';
import TableHeadColumnRenderer from './TableHeadColumnRenderer';
import useRootStore from '../../hooks/useRootStore';
import { useScrollSync } from '../../hooks/useScrollSync';
import type { Torrent } from '../../types/stores';

interface RootStore {
  flushTorrentList: () => void;
  isRefreshing: boolean;
  config: {
    torrentsSort: { by: string; direction: number };
    visibleTorrentColumns: Column[];
    activeTorrentColumns: Column[];
    setTorrentsSort: (column: string, direction: number) => void;
    moveTorrentsColumn: (from: string, to: string) => void;
    saveTorrentsColumns: () => void;
  };
  torrentList: {
    sortedTorrents: Torrent[];
    isSelectedAll: boolean;
    toggleSelectAll: () => void;
  };
}

const TorrentListTable = observer(() => {
  const rootStore = useRootStore() as unknown as RootStore;
  const refFixedHead = useRef<HTMLTableElement>(null);
  const handleScroll = useScrollSync(refFixedHead as React.RefObject<HTMLElement>);

  useEffect(() => {
    rootStore.flushTorrentList();
  }, [rootStore]);

  const columnVars: Record<string, string> = {};
  rootStore.config.visibleTorrentColumns.forEach((col) => {
    columnVars[`--col-${col.column}-w`] = `${col.width}px`;
  });

  return (
    <div onScroll={handleScroll} className="torrent-list-layer" style={columnVars}>
      {rootStore.isRefreshing && (
        <div className="torrent-list-loading">
          <div className="spinner spinner--large" />
        </div>
      )}
      <ColumnContextMenu
        columns={rootStore.config.activeTorrentColumns}
        onSave={() => rootStore.config.saveTorrentsColumns()}
      >
        <table
          ref={refFixedHead}
          className="torrent-table-head"
          border={0}
          cellSpacing={0}
          cellPadding={0}
        >
          <TorrentListTableHead />
        </table>
      </ColumnContextMenu>
      <table className="torrent-table-body" border={0} cellSpacing={0} cellPadding={0}>
        <TorrentListTableHead />
        <TorrentListTableTorrents />
      </table>
    </div>
  );
});

const TORRENT_FIXED_COLUMNS = ['checkbox', 'actions'];

const TorrentListTableHead = observer(() => {
  const rootStore = useRootStore() as unknown as RootStore;
  const torrentListStore = rootStore.torrentList;

  const handleSort = useCallback(
    (column: string, direction: number) => {
      rootStore.config.setTorrentsSort(column, direction);
    },
    [rootStore]
  );

  const handleMoveColumn = useCallback(
    (from: string, to: string) => {
      rootStore.config.moveTorrentsColumn(from, to);
    },
    [rootStore]
  );

  const handleSaveColumns = useCallback(() => {
    rootStore.config.saveTorrentsColumns();
  }, [rootStore]);

  const handleToggleSelectAll = useCallback(() => {
    torrentListStore?.toggleSelectAll();
  }, [torrentListStore]);

  const torrentsSort = rootStore.config.torrentsSort;
  const torrentColumns = rootStore.config.visibleTorrentColumns;

  return (
    <thead>
      <tr>
        {torrentColumns.map((column) => (
          <TableHeadColumnRenderer
            key={column.column}
            column={column}
            isSorted={torrentsSort.by === column.column}
            sortDirection={torrentsSort.direction}
            onMoveColumn={handleMoveColumn}
            onSort={handleSort}
            onSaveColumns={handleSaveColumns}
            type="tr"
            fixedColumns={TORRENT_FIXED_COLUMNS}
            isSelectedAll={torrentListStore.isSelectedAll}
            onToggleSelectAll={handleToggleSelectAll}
          />
        ))}
      </tr>
    </thead>
  );
});

const TorrentListTableTorrents = observer(() => {
  const rootStore = useRootStore() as unknown as RootStore;
  const torrentListStore = rootStore.torrentList;

  return (
    <tbody>
      {torrentListStore.sortedTorrents.map((torrent) => (
        <TorrentListTableItem key={torrent.id} torrent={torrent as Torrent} />
      ))}
    </tbody>
  );
});

export default TorrentListTable;
