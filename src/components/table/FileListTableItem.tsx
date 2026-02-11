import { observer } from 'mobx-react';
import React, { useCallback, ChangeEvent } from 'react';
import useRootStore from '../../hooks/useRootStore';
import FileContextMenu from '../menu/FileContextMenu';
import fileColumnRenderers, { FileColumnCtx } from './fileColumns';
import type { FileEntry } from '../../types/stores';

interface FileListStore {
  addMultipleSelectedId: (id: string) => void;
  addSelectedId: (id: string) => void;
  removeSelectedId: (id: string) => void;
  filterLevel: number;
  setFilter: (filter: string) => void;
}

interface FileListTableItemProps {
  file: FileEntry;
}

const FileListTableItem = observer(({ file }: FileListTableItemProps) => {
  const rootStore = useRootStore();
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

  if (!config || !fileListStore) return null;

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
