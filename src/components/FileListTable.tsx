import React, { useContext, useRef, useEffect, useCallback, useMemo, MouseEvent, ChangeEvent } from "react";
import { observer } from "mobx-react";
import TableHeadColumn, { Column } from "./TableHeadColumn";
import FileListTableItem from "./FileListTableItem";
import FileColumnContextMenu from "./FileColumnMenu";
import Interval from "./Interval";
import getLogger from "../tools/getLogger";
import RootStoreCtx from "../tools/rootStoreCtx";
import { useScrollSync } from "../hooks/useScrollSync";

const logger = getLogger('FileListTable');

interface FileItem {
  name: string;
  selected: boolean;
  sizeStr: string;
  downloadedStr: string;
  progressStr: string;
  priorityStr: string;
  size: number;
  downloaded: number;
  priority: number;
  shortName: string;
  nameParts: string[];
}

interface FileListStore {
  id: number;
  torrent: unknown;
  isLoading: boolean;
  joinedDirectory: string;
  setRemoveSelectOnHide: (value: boolean) => void;
  fetchFiles: () => Promise<void>;
  sortedFiles: FileItem[];
  isSelectedAll: boolean;
  toggleSelectAll: () => void;
}

interface RootStore {
  torrentList: {
    isSelectedId: (id: number) => boolean;
    addSelectedId: (id: number, silent?: boolean) => void;
  };
  fileList: FileListStore;
  destroyFileList: () => void;
  config: {
    uiUpdateInterval: number;
    filesSort: { by: string; direction: number };
    visibleFileColumns: Column[];
    setFilesSort: (column: string, direction: number) => void;
    moveFilesColumn: (from: string, to: string) => void;
    saveFilesColumns: () => void;
  };
}

const FileListTable: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;
  const fileListStore = rootStore?.fileList;
  const refFixedHead = useRef<HTMLTableElement>(null);
  const scrollSyncOptions = useMemo(() => ({ withWidthCheck: true }), []);
  const handleScroll = useScrollSync(refFixedHead as React.RefObject<HTMLElement>, scrollSyncOptions);

  useEffect(() => {
    if (!rootStore || !fileListStore) return;
    if (!rootStore.torrentList.isSelectedId(fileListStore.id)) {
      fileListStore.setRemoveSelectOnHide(true);
    }
    rootStore.torrentList.addSelectedId(fileListStore.id, true);
  }, [rootStore, fileListStore]);

  const handleClose = useCallback((e?: MouseEvent) => {
    e?.preventDefault();
    rootStore?.destroyFileList();
  }, [rootStore]);

  const handleUpdate = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    fileListStore?.fetchFiles();
  }, [fileListStore]);

  const onIntervalFire = useCallback(() => {
    fileListStore?.fetchFiles().catch((err) => {
      logger.error('onIntervalFire fetchFiles error', err);
    });
  }, [fileListStore]);

  if (!rootStore || !fileListStore) return null;

  const torrent = fileListStore.torrent;

  if (!torrent) {
    return (
      <DoCloseFileList onClose={handleClose}/>
    );
  }

  let spinner: React.ReactNode = null;
  if (fileListStore.isLoading) {
    spinner = (
      <div className="loading"/>
    );
  }

  let directory: React.ReactNode = null;
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
              <table ref={refFixedHead} className="fl-table-head" border={0} cellSpacing={0} cellPadding={0}>
                <FileListTableHead withStyle={true}/>
              </table>
            </FileColumnContextMenu>
            <table className="fl-table-body" border={0} cellSpacing={0} cellPadding={0}>
              <FileListTableHead/>
              <FileListTableFiles/>
            </table>
          </div>
          <div className="bottom-menu">
            {directory}
            <div className="space"/>
            <a onClick={handleUpdate} className="update" title={chrome.i18n.getMessage('refresh')} aria-label={chrome.i18n.getMessage('refresh')}/>
            <a onClick={handleClose as (e: MouseEvent<HTMLAnchorElement>) => void} className="close" title={chrome.i18n.getMessage('DLG_BTN_CLOSE')} aria-label={chrome.i18n.getMessage('DLG_BTN_CLOSE')}/>
          </div>
        </div>
      </div>
      <div onClick={handleClose as unknown as (e: MouseEvent<HTMLDivElement>) => void} className="file-list-layer-temp"/>
    </>
  );
});

interface DoCloseFileListProps {
  onClose: () => void;
}

const DoCloseFileList = React.memo<DoCloseFileListProps>(({ onClose }) => {
  React.useEffect(() => {
    onClose();
  }, [onClose]);
  return null;
});

interface FileListTableHeadProps {
  withStyle?: boolean;
}

@observer
class FileListTableHead extends React.PureComponent<FileListTableHeadProps> {
  static contextType = RootStoreCtx;
  context!: RootStore | null;

  get rootStore(): RootStore | null {
    return this.context;
  }

  handleSort = (column: string, direction: number): void => {
    this.rootStore?.config.setFilesSort(column, direction);
  };

  handleMoveColumn = (from: string, to: string): void => {
    this.rootStore?.config.moveFilesColumn(from, to);
  };

  handleSaveColumns = (): void => {
    this.rootStore?.config.saveFilesColumns();
  };

  render(): React.ReactNode {
    if (!this.rootStore) return null;

    const sort = this.rootStore.config.filesSort;
    const fileColumns = this.rootStore.config.visibleFileColumns;
    const columns: React.ReactNode[] = [];
    fileColumns.forEach((column) => {
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

  get fileListStore(): FileListStore | undefined {
    return this.rootStore?.fileList as FileListStore | undefined;
  }

  handleSelectAll = (_e: ChangeEvent<HTMLInputElement>): void => {
    this.fileListStore?.toggleSelectAll();
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
          <input checked={this.fileListStore?.isSelectedAll} onChange={this.handleSelectAll} type="checkbox"/>
        </div>
      );
    } else {
      body = (
        <div>
          {chrome.i18n.getMessage(column.lang + '_SHORT') || chrome.i18n.getMessage(column.lang)}
        </div>
      );
    }

    let style: React.ReactNode = null;
    if (this.props.withStyle) {
      const styleText = `.fl-layer th.${column.column}, .fl-layer td.${column.column} {
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
  context!: RootStore | null;

  get rootStore(): RootStore | null {
    return this.context;
  }

  render(): React.ReactNode {
    if (!this.rootStore?.fileList) return null;

    const files = this.rootStore.fileList.sortedFiles.map((file) => {
      return (
        <FileListTableItem key={file.name} file={file as FileItem}/>
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
