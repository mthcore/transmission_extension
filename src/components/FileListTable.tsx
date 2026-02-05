import React, { useContext, useRef, useEffect, useCallback, useMemo, MouseEvent, ChangeEvent } from "react";
import { observer } from "mobx-react";
import { Column } from "./TableHeadColumn";
import FileListTableItem from "./FileListTableItem";
import FileColumnContextMenu from "./FileColumnMenu";
import Interval from "./Interval";
import getLogger from "../tools/getLogger";
import RootStoreCtx from "../tools/rootStoreCtx";
import { useScrollSync } from "../hooks/useScrollSync";
import { useTableHeadColumn } from "../hooks/useTableHeadColumn";

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

const FileListTableHead: React.FC<FileListTableHeadProps> = observer(({ withStyle }) => {
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;

  const handleSort = useCallback((column: string, direction: number): void => {
    rootStore?.config.setFilesSort(column, direction);
  }, [rootStore]);

  const handleMoveColumn = useCallback((from: string, to: string): void => {
    rootStore?.config.moveFilesColumn(from, to);
  }, [rootStore]);

  const handleSaveColumns = useCallback((): void => {
    rootStore?.config.saveFilesColumns();
  }, [rootStore]);

  if (!rootStore) return null;

  const sort = rootStore.config.filesSort;
  const fileColumns = rootStore.config.visibleFileColumns;

  return (
    <thead>
      <tr>
        {fileColumns
          .filter((column) => column.display)
          .map((column) => (
            <FileListTableHeadColumn
              key={column.column}
              column={column}
              isSorted={sort.by === column.column}
              sortDirection={sort.direction}
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

interface FileListTableHeadColumnProps {
  column: Column;
  isSorted: boolean;
  sortDirection: number;
  onMoveColumn: (from: string, to: string) => void;
  onSort: (column: string, direction: number) => void;
  onSaveColumns: () => void;
  withStyle?: boolean;
}

const FileListTableHeadColumn: React.FC<FileListTableHeadColumnProps> = observer((props) => {
  const { column, isSorted, sortDirection, onMoveColumn, onSort, onSaveColumns, withStyle } = props;
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;
  const fileListStore = rootStore?.fileList;

  const {
    refTh,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleResizeClick,
    handleResizeMouseDown,
    handleSort,
  } = useTableHeadColumn({
    type: 'fl',
    column,
    onMoveColumn,
    onSaveColumns,
    onSort,
    isSorted,
    sortDirection,
  });

  const handleSelectAll = useCallback((_e: ChangeEvent<HTMLInputElement>): void => {
    fileListStore?.toggleSelectAll();
  }, [fileListStore]);

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
        <input checked={fileListStore?.isSelectedAll} onChange={handleSelectAll} type="checkbox"/>
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
  if (withStyle) {
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

  const onClick = column.order ? handleSort : undefined;
  const isFixedColumn = column.column === 'checkbox';
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

const FileListTableFiles: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;

  if (!rootStore?.fileList) return null;

  return (
    <tbody>
      {rootStore.fileList.sortedFiles.map((file) => (
        <FileListTableItem key={file.name} file={file as FileItem}/>
      ))}
    </tbody>
  );
});

export default FileListTable;
