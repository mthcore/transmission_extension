import { observer } from 'mobx-react';
import React, { useContext, useCallback, ChangeEvent } from 'react';
import RootStoreCtx from '../tools/rootStoreCtx';
import FileContextMenu from './FileContextMenu';
import fileColumnRenderers, { FileColumnCtx } from './fileColumns';

interface File {
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
  addMultipleSelectedId: (id: string) => void;
  addSelectedId: (id: string) => void;
  removeSelectedId: (id: string) => void;
  filterLevel: number;
  setFilter: (filter: string) => void;
}

interface FileListTableItemProps {
  file: File;
}

const FileListTableItem: React.FC<FileListTableItemProps> = observer(({ file }) => {
  const rootStore = useContext(RootStoreCtx);
  const fileListStore = rootStore?.fileList as FileListStore | undefined;
  const config = rootStore?.config;

  const handleSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!file.selected) {
        if (e.nativeEvent instanceof MouseEvent && (e.nativeEvent as MouseEvent).shiftKey) {
          fileListStore?.addMultipleSelectedId(file.name);
        } else {
          fileListStore?.addSelectedId(file.name);
        }
      } else {
        fileListStore?.removeSelectedId(file.name);
      }
    },
    [file, fileListStore]
  );

  if (!rootStore || !config || !fileListStore) return null;

  const visibleFileColumns = config.visibleFileColumns as unknown as Array<{ column: string }>;

  const ctx: FileColumnCtx = {
    file,
    handleSelect,
    fileListStore,
  };

  const columns = visibleFileColumns.map(({ column: name }) => {
    const renderer = fileColumnRenderers[name];
    return renderer ? renderer(ctx) : null;
  });

  const classList: string[] = [];
  if (file.selected) {
    classList.push('selected');
  }

  return (
    <FileContextMenu fileId={file.name}>
      <tr className={classList.join(' ')}>{columns}</tr>
    </FileContextMenu>
  );
});

export default FileListTableItem;
