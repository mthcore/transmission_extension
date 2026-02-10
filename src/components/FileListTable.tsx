import React, { useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react';
import { Column } from './TableHeadColumn';
import FileListTableItem from './FileListTableItem';
import FileColumnContextMenu from './FileColumnMenu';
import TableHeadColumnRenderer from './TableHeadColumnRenderer';
import Interval from './Interval';
import getLogger from '../tools/getLogger';
import RootStoreCtx from '../tools/rootStoreCtx';
import { useScrollSync } from '../hooks/useScrollSync';

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
  const handleScroll = useScrollSync(
    refFixedHead as React.RefObject<HTMLElement>,
    scrollSyncOptions
  );

  useEffect(() => {
    if (!rootStore || !fileListStore) return;
    if (!rootStore.torrentList.isSelectedId(fileListStore.id)) {
      fileListStore.setRemoveSelectOnHide(true);
    }
    rootStore.torrentList.addSelectedId(fileListStore.id, true);
  }, [rootStore, fileListStore]);

  const handleClose = useCallback(
    (e?: React.MouseEvent<HTMLElement>) => {
      e?.preventDefault();
      rootStore?.destroyFileList();
    },
    [rootStore]
  );

  const handleUpdate = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      fileListStore?.fetchFiles();
    },
    [fileListStore]
  );

  const onIntervalFire = useCallback(() => {
    fileListStore?.fetchFiles().catch((err) => {
      logger.error('onIntervalFire fetchFiles error', err);
    });
  }, [fileListStore]);

  if (!rootStore || !fileListStore) return null;

  const torrent = fileListStore.torrent;

  if (!torrent) {
    return <DoCloseFileList onClose={handleClose} />;
  }

  let spinner: React.ReactNode = null;
  if (fileListStore.isLoading) {
    spinner = <div className="loading" />;
  }

  let directory: React.ReactNode = null;
  if (fileListStore.joinedDirectory) {
    directory = <input type="text" value={fileListStore.joinedDirectory} readOnly />;
  }

  const uiUpdateInterval = rootStore.config.uiUpdateInterval;

  const columnVars: Record<string, string> = {};
  rootStore.config.visibleFileColumns
    .filter((col) => col.display)
    .forEach((col) => {
      columnVars[`--col-${col.column}-w`] = `${col.width}px`;
    });

  return (
    <>
      <div className="file-list-warpper">
        <div className="file-list">
          <Interval interval={uiUpdateInterval} onFire={onIntervalFire} />
          <div onScroll={handleScroll} className="fl-layer" style={columnVars}>
            {spinner}
            <FileColumnContextMenu>
              <table
                ref={refFixedHead}
                className="fl-table-head"
                border={0}
                cellSpacing={0}
                cellPadding={0}
              >
                <FileListTableHead />
              </table>
            </FileColumnContextMenu>
            <table className="fl-table-body" border={0} cellSpacing={0} cellPadding={0}>
              <FileListTableHead />
              <FileListTableFiles />
            </table>
          </div>
          <div className="bottom-menu">
            {directory}
            <div className="space" />
            <a
              onClick={handleUpdate}
              className="update"
              title={chrome.i18n.getMessage('refresh')}
              aria-label={chrome.i18n.getMessage('refresh')}
            />
            <a
              onClick={handleClose}
              className="close"
              title={chrome.i18n.getMessage('DLG_BTN_CLOSE')}
              aria-label={chrome.i18n.getMessage('DLG_BTN_CLOSE')}
            />
          </div>
        </div>
      </div>
      <div
        onClick={handleClose}
        className="file-list-layer-temp"
      />
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

const FILE_FIXED_COLUMNS = ['checkbox'];

const FileListTableHead: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;
  const fileListStore = rootStore?.fileList;

  const handleSort = useCallback(
    (column: string, direction: number): void => {
      rootStore?.config.setFilesSort(column, direction);
    },
    [rootStore]
  );

  const handleMoveColumn = useCallback(
    (from: string, to: string): void => {
      rootStore?.config.moveFilesColumn(from, to);
    },
    [rootStore]
  );

  const handleSaveColumns = useCallback((): void => {
    rootStore?.config.saveFilesColumns();
  }, [rootStore]);

  const handleToggleSelectAll = useCallback((): void => {
    fileListStore?.toggleSelectAll();
  }, [fileListStore]);

  if (!rootStore || !fileListStore) return null;

  const sort = rootStore.config.filesSort;
  const fileColumns = rootStore.config.visibleFileColumns;

  return (
    <thead>
      <tr>
        {fileColumns
          .filter((column) => column.display)
          .map((column) => (
            <TableHeadColumnRenderer
              key={column.column}
              column={column}
              isSorted={sort.by === column.column}
              sortDirection={sort.direction}
              onMoveColumn={handleMoveColumn}
              onSort={handleSort}
              onSaveColumns={handleSaveColumns}
              type="fl"
              fixedColumns={FILE_FIXED_COLUMNS}
              isSelectedAll={fileListStore.isSelectedAll}
              onToggleSelectAll={handleToggleSelectAll}
            />
          ))}
      </tr>
    </thead>
  );
});

const FileListTableFiles: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx) as unknown as RootStore | null;

  if (!rootStore?.fileList) return null;

  return (
    <tbody>
      {rootStore.fileList.sortedFiles.map((file) => (
        <FileListTableItem key={file.name} file={file as FileItem} />
      ))}
    </tbody>
  );
});

export default FileListTable;
