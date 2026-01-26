import React, {useContext, useRef, useEffect, useCallback, useMemo} from "react";
import {observer} from "mobx-react";
import TableHeadColumn from "./TableHeadColumn";
import PropTypes from "prop-types";
import FileListTableItem from "./FileListTableItem";
import FileColumnContextMenu from "./FileColumnMenu";
import Interval from "./Interval";
import getLogger from "../tools/getLogger";
import RootStoreCtx from "../tools/RootStoreCtx";
import {useScrollSync} from "../hooks/useScrollSync";

const logger = getLogger('FileListTable');

const FileListTable = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const fileListStore = rootStore.fileList;
  const refFixedHead = useRef(null);
  const scrollSyncOptions = useMemo(() => ({withWidthCheck: true}), []);
  const handleScroll = useScrollSync(refFixedHead, scrollSyncOptions);

  useEffect(() => {
    if (!rootStore.torrentList.isSelectedId(fileListStore.id)) {
      fileListStore.setRemoveSelectOnHide(true);
    }
    rootStore.torrentList.addSelectedId(fileListStore.id, true);
  }, [rootStore, fileListStore]);

  const handleClose = useCallback((e) => {
    e && e.preventDefault();
    rootStore.destroyFileList();
  }, [rootStore]);

  const handleUpdate = useCallback((e) => {
    e.preventDefault();
    fileListStore.fetchFiles();
  }, [fileListStore]);

  const onIntervalFire = useCallback(() => {
    fileListStore.fetchFiles().catch((err) => {
      logger.error('onIntervalFire fetchFiles error', err);
    });
  }, [fileListStore]);

  const torrent = fileListStore.torrent;

  if (!torrent) {
    return (
      <DoCloseFileList onClose={handleClose}/>
    );
  }

  let spinner = null;
  if (fileListStore.isLoading) {
    spinner = (
      <div className="loading"/>
    );
  }

  let directory = null;
  if (fileListStore.joinedDirectory) {
    directory = (
      <input type="text" value={fileListStore.joinedDirectory} readOnly/>
    );
  }

  const uiUpdateInterval = rootStore.config.uiUpdateInterval;

  return (
    <>
      <div className="file-list-warpper">
        <div className="file-list">
          <Interval interval={uiUpdateInterval} onFire={onIntervalFire}/>
          <div onScroll={handleScroll} className="fl-layer">
            {spinner}
            <FileColumnContextMenu>
              <table ref={refFixedHead} className="fl-table-head" border="0" cellSpacing="0" cellPadding="0">
                <FileListTableHead withStyle={true}/>
              </table>
            </FileColumnContextMenu>
            <table className="fl-table-body" border="0" cellSpacing="0" cellPadding="0">
              <FileListTableHead/>
              <FileListTableFiles/>
            </table>
          </div>
          <div className="bottom-menu">
            {directory}
            <div className="space"/>
            <a onClick={handleUpdate} className="update" title={chrome.i18n.getMessage('refresh')}/>
            <a onClick={handleClose} className="close" title={chrome.i18n.getMessage('DLG_BTN_CLOSE')}/>
          </div>
        </div>
      </div>
      <div onClick={handleClose} className="file-list-layer-temp"/>
    </>
  );
});

const DoCloseFileList = React.memo(({onClose}) => {
  React.useEffect(() => {
    onClose();
  }, []);
  return null;
});
DoCloseFileList.propTypes = {
  onClose: PropTypes.func.isRequired,
};

@observer
class FileListTableHead extends React.PureComponent {
  static propTypes = {
    withStyle: PropTypes.bool,
  };

  static contextType = RootStoreCtx;

  /**@return {RootStore}*/
  get rootStore() {
    return this.context;
  }

  handleSort = (column, direction) => {
    this.rootStore.config.setFilesSort(column, direction);
  };

  handleMoveColumn = (from, to) => {
    this.rootStore.config.moveFilesColumn(from, to);
  };

  handleSaveColumns = () => {
    this.rootStore.config.saveFilesColumns();
  };

  render() {
    const sort = this.rootStore.config.filesSort;
    const fileColumns = this.rootStore.config.visibleFileColumns;
    const columns = [];
    fileColumns.forEach((column, index) => {
      if (!column.display) return;

      columns.push(
        <FileListTableHeadColumn key={column.column} column={column}
          isSorted={sort.by === column.column} sortDirection={sort.direction}
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
class FileListTableHeadColumn extends TableHeadColumn {
  type = 'fl';

  /**@return {FileListStore}*/
  get fileListStore() {
    return this.rootStore.fileList;
  }

  handleSelectAll = (e) => {
    this.fileListStore.toggleSelectAll();
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
          <input checked={this.fileListStore.isSelectedAll} onChange={this.handleSelectAll} type="checkbox"/>
        </div>
      );
    } else {
      body = (
        <div>
          {chrome.i18n.getMessage(column.lang + '_SHORT') || chrome.i18n.getMessage(column.lang)}
        </div>
      );
    }

    let style = null;
    if (this.props.withStyle) {
      const styleText = `.fl-layer th.${column.column}, .fl-layer td.${column.column} {
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

    const isFixedColumn = column.column === 'checkbox';
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
class FileListTableFiles extends React.PureComponent {
  static contextType = RootStoreCtx;

  /**@return {RootStore}*/
  get rootStore() {
    return this.context;
  }

  render() {
    const files = this.rootStore.fileList.sortedFiles.map((file) => {
      return (
        <FileListTableItem key={file.name} file={file}/>
      );
    });

    return (
      <tbody>
        {files}
      </tbody>
    );
  }
}

export default FileListTable;