import React, { useContext, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { observer } from 'mobx-react';
import { Column } from './TableHeadColumn';
import TorrentListTableItem from './TorrentListTableItem';
import TorrentColumnContextMenu from './TorrentColumnMenu';
import RootStoreCtx from '../tools/rootStoreCtx';
import { useScrollSync } from '../hooks/useScrollSync';
import { useTableHeadColumn } from '../hooks/useTableHeadColumn';

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

  return (
    <div onScroll={handleScroll} className="torrent-list-layer">
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
          <TorrentListTableHead withStyle={true} />
        </table>
      </TorrentColumnContextMenu>
      <table className="torrent-table-body" border={0} cellSpacing={0} cellPadding={0}>
        <TorrentListTableHead />
        <TorrentListTableTorrents />
      </table>
    </div>
  );
});

interface TorrentListTableHeadProps {
  withStyle?: boolean;
}

const TorrentListTableHead: React.FC<TorrentListTableHeadProps> = observer(({ withStyle }) => {
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;

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

  if (!rootStore) return null;

  const torrentsSort = rootStore.config.torrentsSort;
  const torrentColumns = rootStore.config.visibleTorrentColumns;

  return (
    <thead>
      <tr>
        {torrentColumns.map((column) => (
          <TorrentListTableHeadColumn
            key={column.column}
            column={column}
            isSorted={torrentsSort.by === column.column}
            sortDirection={torrentsSort.direction}
            onMoveColumn={handleMoveColumn}
            onSort={handleSort}
            onSaveColumns={handleSaveColumns}
            withStyle={withStyle}
          />
        ))}
      </tr>
    </thead>
  );
});

interface TorrentListTableHeadColumnProps {
  column: Column;
  isSorted: boolean;
  sortDirection: number;
  onMoveColumn: (from: string, to: string) => void;
  onSort: (column: string, direction: number) => void;
  onSaveColumns: () => void;
  withStyle?: boolean;
}

const TorrentListTableHeadColumn: React.FC<TorrentListTableHeadColumnProps> = observer((props) => {
  const { column, isSorted, sortDirection, onMoveColumn, onSort, onSaveColumns, withStyle } = props;
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;
  const torrentListStore = rootStore?.torrentList;

  const {
    refTh,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleResizeClick,
    handleResizeMouseDown,
    handleSort,
  } = useTableHeadColumn({
    type: 'tr',
    column,
    onMoveColumn,
    onSaveColumns,
    onSort,
    isSorted,
    sortDirection,
  });

  const handleSelectAll = useCallback(
    (_e: ChangeEvent<HTMLInputElement>): void => {
      torrentListStore?.toggleSelectAll();
    },
    [torrentListStore]
  );

  const classList = [column.column];
  if (isSorted) {
    if (sortDirection === 1) {
      classList.push('sortDown');
    } else {
      classList.push('sortUp');
    }
  }

  let body: React.ReactNode = null;
  if (column.column === 'checkbox') {
    body = (
      <div>
        <input
          checked={torrentListStore?.isSelectedAll}
          onChange={handleSelectAll}
          type="checkbox"
        />
      </div>
    );
  } else if (column.column === 'actions') {
    body = <div />;
  } else {
    body = (
      <div>
        {chrome.i18n.getMessage(column.lang + '_SHORT') || chrome.i18n.getMessage(column.lang)}
      </div>
    );
  }

  let style: React.ReactNode = null;
  if (withStyle) {
    const styleText =
      `.torrent-list-layer th.${column.column}, .torrent-list-layer td.${column.column} {
      min-width: ${column.width}px;
      max-width: ${column.width}px;
    }`
        .split(/\r?\n/)
        .map((line) => line.trim())
        .join('');
    style = <style>{styleText}</style>;
  }

  let arrow: React.ReactNode = null;
  if (column.order !== 0) {
    arrow = <i className="arrow" />;
  }

  const onClick = column.order ? handleSort : undefined;
  const isFixedColumn = column.column === 'checkbox' || column.column === 'actions';
  const title = isFixedColumn ? '' : chrome.i18n.getMessage(column.lang);

  return (
    <th
      ref={refTh}
      onClick={onClick}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={classList.join(' ')}
      title={title}
      draggable={true}
    >
      {body}
      {!isFixedColumn && (
        <div
          className="resize-el"
          draggable={false}
          onClick={handleResizeClick}
          onMouseDown={handleResizeMouseDown}
        />
      )}
      {arrow}
      {style}
    </th>
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
