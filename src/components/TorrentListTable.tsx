import React, { useContext, useRef, useEffect, ChangeEvent, MouseEvent } from "react";
import { observer } from "mobx-react";
import TableHeadColumn, { Column } from "./TableHeadColumn";
import TorrentListTableItem from "./TorrentListTableItem";
import TorrentColumnContextMenu from "./TorrentColumnMenu";
import RootStoreCtx from "../tools/rootStoreCtx";
import { useScrollSync } from "../hooks/useScrollSync";

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
        <table ref={refFixedHead} className="torrent-table-head" border={0} cellSpacing={0} cellPadding={0}>
          <TorrentListTableHead withStyle={true}/>
        </table>
      </TorrentColumnContextMenu>
      <table className="torrent-table-body" border={0} cellSpacing={0} cellPadding={0}>
        <TorrentListTableHead/>
        <TorrentListTableTorrents/>
      </table>
    </div>
  );
});

interface TorrentListTableHeadProps {
  withStyle?: boolean;
}

@observer
class TorrentListTableHead extends React.PureComponent<TorrentListTableHeadProps> {
  static contextType = RootStoreCtx;
  context!: RootStore | null;

  get rootStore(): RootStore | null {
    return this.context;
  }

  handleSort = (column: string, direction: number): void => {
    this.rootStore?.config.setTorrentsSort(column, direction);
  };

  handleMoveColumn = (from: string, to: string): void => {
    this.rootStore?.config.moveTorrentsColumn(from, to);
  };

  handleSaveColumns = (): void => {
    this.rootStore?.config.saveTorrentsColumns();
  };

  render(): React.ReactNode {
    if (!this.rootStore) return null;

    const torrentsSort = this.rootStore.config.torrentsSort;
    const torrentColumns = this.rootStore.config.visibleTorrentColumns;
    const columns: React.ReactNode[] = [];
    torrentColumns.forEach((column) => {
      columns.push(
        <TorrentListTableHeadColumn key={column.column} column={column}
          isSorted={torrentsSort.by === column.column} sortDirection={torrentsSort.direction}
          onMoveColumn={this.handleMoveColumn}
          onSort={this.handleSort}
          onSaveColumns={this.handleSaveColumns}
          withStyle={this.props.withStyle}
        />
      );
    });

    return (
      <thead>
      <tr>
        {columns}
      </tr>
      </thead>
    );
  }
}

interface TorrentListStore {
  isSelectedAll: boolean;
  toggleSelectAll: () => void;
}

@observer
class TorrentListTableHeadColumn extends TableHeadColumn {
  type = 'tr';

  get torrentListStore(): TorrentListStore | undefined {
    return this.rootStore?.torrentList as TorrentListStore | undefined;
  }

  handleSelectAll = (_e: ChangeEvent<HTMLInputElement>): void => {
    this.torrentListStore?.toggleSelectAll();
  };

  render(): React.ReactNode {
    const { column, isSorted, sortDirection } = this.props;
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
          <input checked={this.torrentListStore?.isSelectedAll} onChange={this.handleSelectAll} type="checkbox"/>
        </div>
      );
    } else if (column.column === 'actions') {
      body = <div/>;
    } else {
      body = (
        <div>
          {chrome.i18n.getMessage(column.lang + '_SHORT') || chrome.i18n.getMessage(column.lang)}
        </div>
      );
    }

    let style: React.ReactNode = null;
    if (this.props.withStyle) {
      const styleText = `.torrent-list-layer th.${column.column}, .torrent-list-layer td.${column.column} {
        min-width: ${column.width}px;
        max-width: ${column.width}px;
      }`.split(/\r?\n/).map(line => line.trim()).join('');
      style = (
        <style>{styleText}</style>
      );
    }

    let arrow: React.ReactNode = null;
    if (column.order !== 0) {
      arrow = (
        <i className="arrow"/>
      );
    }

    let onClick: ((e: MouseEvent<HTMLTableCellElement>) => void) | undefined = undefined;
    if (column.order) {
      onClick = this.handleSort;
    }

    const isFixedColumn = column.column === 'checkbox' || column.column === 'actions';
    const title = isFixedColumn ? '' : chrome.i18n.getMessage(column.lang);

    return (
      <th ref={this.refTh} onClick={onClick} onDragStart={this.handleDragStart} onDragOver={this.handleDragOver} onDrop={this.handleDrop} className={classList.join(' ')} title={title} draggable={true}>
        {body}
        {!isFixedColumn && <div className="resize-el" draggable={false} onClick={this.handleResizeClick} onMouseDown={this.handleResizeMouseDown}/>}
        {arrow}
        {style}
      </th>
    );
  }
}

@observer
class TorrentListTableTorrents extends React.PureComponent {
  static contextType = RootStoreCtx;
  context!: RootStore | null;

  get rootStore(): RootStore | null {
    return this.context;
  }

  get torrentListStore() {
    return this.rootStore?.torrentList;
  }

  render(): React.ReactNode {
    if (!this.torrentListStore) return null;

    const torrens = this.torrentListStore.sortedTorrents.map((torrent) => {
      return (
        <TorrentListTableItem key={torrent.id} torrent={torrent as TorrentItem}/>
      );
    });

    return (
      <tbody>
        {torrens}
      </tbody>
    );
  }
}

export default TorrentListTable;
