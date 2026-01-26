import React, {useContext, useRef, useEffect} from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import TableHeadColumn from "./TableHeadColumn";
import TorrentListTableItem from "./TorrentListTableItem";
import TorrentColumnContextMenu from "./TorrentColumnMenu";
import RootStoreCtx from "../tools/RootStoreCtx";
import {useScrollSync} from "../hooks/useScrollSync";

const TorrentListTable = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const refFixedHead = useRef(null);
  const handleScroll = useScrollSync(refFixedHead);

  useEffect(() => {
    rootStore.flushTorrentList();
  }, [rootStore]);

  return (
    <div onScroll={handleScroll} className="torrent-list-layer">
      <TorrentColumnContextMenu>
        <table ref={refFixedHead} className="torrent-table-head" border="0" cellSpacing="0" cellPadding="0">
          <TorrentListTableHead withStyle={true}/>
        </table>
      </TorrentColumnContextMenu>
      <table className="torrent-table-body" border="0" cellSpacing="0" cellPadding="0">
        <TorrentListTableHead/>
        <TorrentListTableTorrents/>
      </table>
    </div>
  );
});

@observer
class TorrentListTableHead extends React.PureComponent {
  static propTypes = {
    withStyle: PropTypes.bool,
  };

  static contextType = RootStoreCtx;

  /**@return {RootStore}*/
  get rootStore() {
    return this.context;
  }

  handleSort = (column, direction) => {
    this.rootStore.config.setTorrentsSort(column, direction);
  };

  handleMoveColumn = (from, to) => {
    this.rootStore.config.moveTorrentsColumn(from, to);
  };

  handleSaveColumns = () => {
    this.rootStore.config.saveTorrentsColumns();
  };

  render() {
    const torrentsSort = this.rootStore.config.torrentsSort;
    const torrentColumns = this.rootStore.config.visibleTorrentColumns;
    const columns = [];
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

@observer
class TorrentListTableHeadColumn extends TableHeadColumn {
  type = 'tr';

  /**@return {TorrentListStore}*/
  get torrentListStore() {
    return this.rootStore.torrentList;
  }

  handleSelectAll = (e) => {
    this.torrentListStore.toggleSelectAll();
  };

  render() {
    const {column, isSorted, sortDirection} = this.props;
    const classList = [column.column];
    if (isSorted) {
      if (sortDirection === 1) {
        classList.push('sortDown');
      } else {
        classList.push('sortUp');
      }
    }

    let body = null;
    if (column.column === 'checkbox') {
      body = (
        <div>
          <input checked={this.torrentListStore.isSelectedAll} onChange={this.handleSelectAll} type="checkbox"/>
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

    let style = null;
    if (this.props.withStyle) {
      const styleText = `.torrent-list-layer th.${column.column}, .torrent-list-layer td.${column.column} {
        min-width: ${column.width}px;
        max-width: ${column.width}px;
      }`.split(/\r?\n/).map(line => line.trim()).join('');
      style = (
        <style>{styleText}</style>
      );
    }

    let arrow = null;
    if (column.order !== 0) {
      arrow = (
        <i className="arrow"/>
      );
    }

    let onClick = null;
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

  /**@return {RootStore}*/
  get rootStore() {
    return this.context;
  }

  /**@return {TorrentListStore}*/
  get torrentListStore() {
    return this.rootStore.torrentList;
  }

  render() {
    const torrens = this.torrentListStore.sortedTorrents.map((torrent) => {
      return (
        <TorrentListTableItem key={torrent.id} torrent={torrent}/>
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