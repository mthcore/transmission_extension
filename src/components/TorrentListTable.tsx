import React, { useContext, useRef, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Column } from './TableHeadColumn';
import TorrentListTableItem from './TorrentListTableItem';
import TorrentColumnContextMenu from './TorrentColumnMenu';
import TableHeadColumnRenderer from './TableHeadColumnRenderer';
import RootStoreCtx from '../tools/rootStoreCtx';
import { useScrollSync } from '../hooks/useScrollSync';

interface TorrentItem {
  id: number;
  name: string;
  selected: boolean;
  order: number;
  sizeStr: string;
  remainingStr: string;
  isSeeding: boolean;
  progressStr: string;
  errorMessage?: string;
  stateText: string;
  seeds: number;
  peers: number;
  activePeers: number;
  activeSeeds: number;
  downloadSpeedStr: string;
  uploadSpeedStr: string;
  etaStr: string;
  uploadedStr: string;
  downloadedStr: string;
  shared: number;
  addedTimeStr: string;
  completedTimeStr: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

interface RootStore {
  flushTorrentList: () => void;
  isRefreshing: boolean;
  config: {
    torrentsSort: { by: string; direction: number };
    visibleTorrentColumns: Column[];
    setTorrentsSort: (column: string, direction: number) => void;
    moveTorrentsColumn: (from: string, to: string) => void;
    saveTorrentsColumns: () => void;
  };
  torrentList: {
    sortedTorrents: TorrentItem[];
    isSelectedAll: boolean;
    toggleSelectAll: () => void;
  };
}

const TorrentListTable: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;
  const refFixedHead = useRef<HTMLTableElement>(null);
  const handleScroll = useScrollSync(refFixedHead as React.RefObject<HTMLElement>);

  useEffect(() => {
    rootStore?.flushTorrentList();
  }, [rootStore]);

  if (!rootStore) return null;

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
      <TorrentColumnContextMenu>
        <table
          ref={refFixedHead}
          className="torrent-table-head"
          border={0}
          cellSpacing={0}
          cellPadding={0}
        >
          <TorrentListTableHead />
        </table>
      </TorrentColumnContextMenu>
      <table className="torrent-table-body" border={0} cellSpacing={0} cellPadding={0}>
        <TorrentListTableHead />
        <TorrentListTableTorrents />
      </table>
    </div>
  );
});

const TORRENT_FIXED_COLUMNS = ['checkbox', 'actions'];

const TorrentListTableHead: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;
  const torrentListStore = rootStore?.torrentList;

  const handleSort = useCallback(
    (column: string, direction: number): void => {
      rootStore?.config.setTorrentsSort(column, direction);
    },
    [rootStore]
  );

  const handleMoveColumn = useCallback(
    (from: string, to: string): void => {
      rootStore?.config.moveTorrentsColumn(from, to);
    },
    [rootStore]
  );

  const handleSaveColumns = useCallback((): void => {
    rootStore?.config.saveTorrentsColumns();
  }, [rootStore]);

  const handleToggleSelectAll = useCallback((): void => {
    torrentListStore?.toggleSelectAll();
  }, [torrentListStore]);

  if (!rootStore || !torrentListStore) return null;

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

const TorrentListTableTorrents: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;
  const torrentListStore = rootStore?.torrentList;

  if (!torrentListStore) return null;

  return (
    <tbody>
      {torrentListStore.sortedTorrents.map((torrent) => (
        <TorrentListTableItem key={torrent.id} torrent={torrent as TorrentItem} />
      ))}
    </tbody>
  );
});

export default TorrentListTable;
