import { observer } from "mobx-react";
import React, { useContext, useCallback, ChangeEvent } from "react";
import RootStoreCtx from "../tools/rootStoreCtx";
import FileContextMenu from "./FileContextMenu";
import { PROGRESS_LIGHT_DENOMINATOR } from "../constants";

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

  const handleSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (!file.selected) {
      if (e.nativeEvent instanceof MouseEvent && (e.nativeEvent as MouseEvent).shiftKey) {
        fileListStore?.addMultipleSelectedId(file.name);
      } else {
        fileListStore?.addSelectedId(file.name);
      }
    } else {
      fileListStore?.removeSelectedId(file.name);
    }
  }, [file, fileListStore]);

  if (!rootStore || !config) return null;

  const visibleFileColumns = config.visibleFileColumns as unknown as Array<{ column: string }>;

  const columns: React.ReactNode[] = [];
  visibleFileColumns.forEach(({ column: name }) => {
    switch (name) {
      case 'checkbox': {
        columns.push(
          <td key={name} className={name}>
            <input checked={file.selected} onChange={handleSelect} type="checkbox"/>
          </td>
        );
        break;
      }
      case 'name': {
        columns.push(
          <td key={name} className={name}>
            <FileName fileListStore={fileListStore!} fileStore={file}/>
          </td>
        );
        break;
      }
      case 'size': {
        columns.push(
          <td key={name} className={name}>
            <div>{file.sizeStr}</div>
          </td>
        );
        break;
      }
      case 'downloaded': {
        columns.push(
          <td key={name} className={name}>
            <div>{file.downloadedStr}</div>
          </td>
        );
        break;
      }
      case 'done': {
        const isComplete = file.size === file.downloaded && file.priority !== 0;
        const progressClass = isComplete ? 'complete' : 'downloading';
        const progressWidth = file.progressStr;
        const progressNum = parseFloat(progressWidth) || 0;
        const lightWidth = progressNum > 0 ? `${PROGRESS_LIGHT_DENOMINATOR / progressNum}%` : '100%';

        columns.push(
          <td key={name} className={name}>
            <div className="progress_b">
              <div className="val">{file.progressStr}</div>
              <div className={`progress_b_i ${progressClass}`} style={{ width: progressWidth }}>
                <div className="val-light" style={{ width: lightWidth }}>{file.progressStr}</div>
              </div>
            </div>
          </td>
        );
        break;
      }
      case 'prio': {
        columns.push(
          <td key={name} className={name}>
            <div>{file.priorityStr}</div>
          </td>
        );
        break;
      }
    }
  });

  const classList: string[] = [];
  if (file.selected) {
    classList.push('selected');
  }

  return (
    <FileContextMenu fileId={file.name}>
      <tr className={classList.join(' ')}>
        {columns}
      </tr>
    </FileContextMenu>
  );
});

interface FileNameProps {
  fileStore: File;
  fileListStore: FileListStore;
}

const FileName: React.FC<FileNameProps> = observer(({ fileStore, fileListStore }) => {
  const handleSetFilter = useCallback((level: number) => {
    let targetLevel = level;
    if (targetLevel === fileListStore.filterLevel) {
      targetLevel--;
    }
    const filter = fileStore.nameParts.slice(0, targetLevel).join('/');
    fileListStore.setFilter(filter);
  }, [fileStore, fileListStore]);

  const parts: string[] = [];
  const nameParts = fileStore.nameParts;
  const filterLevel = fileListStore.filterLevel;

  for (let i = filterLevel; i < nameParts.length; i++) {
    parts.push(nameParts[i]);
  }

  const filename = parts.pop();
  const links = parts.map((name, index) => {
    return (
      <FileNamePart key={name} onSetFilter={handleSetFilter} level={filterLevel + index + 1} name={name}/>
    );
  });

  if (filterLevel > 0) {
    const name = '←';
    links.unshift(
      <FileNamePart key={name} onSetFilter={handleSetFilter} level={filterLevel} name={name}/>
    );
  }

  return (
    <div title={fileStore.shortName}>
      <span>{links}{filename}</span>
    </div>
  );
});

interface FileNamePartProps {
  level: number;
  name: string;
  onSetFilter: (level: number) => void;
}

const FileNamePart = React.memo<FileNamePartProps>(({ level, name, onSetFilter }) => {
  const handleClick = useCallback(() => {
    onSetFilter(level);
  }, [level, onSetFilter]);

  const classList = ['folder', `c${level - 1}`];

  return (
    <button onClick={handleClick} className={classList.join(' ')} type="button">{name}</button>
  );
});

export default FileListTableItem;
