import React, { ChangeEvent } from 'react';
import ProgressBar from './ProgressBar';

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
  filterLevel: number;
  setFilter: (filter: string) => void;
}

export interface FileColumnCtx {
  file: FileItem;
  handleSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  fileListStore: FileListStore;
}

type ColumnRenderer = (ctx: FileColumnCtx) => React.ReactNode;

const fileColumnRenderers: Record<string, ColumnRenderer> = {
  checkbox: ({ file, handleSelect }) => (
    <td key="checkbox" className="checkbox">
      <input
        checked={file.selected}
        onChange={handleSelect}
        type="checkbox"
        aria-label={file.shortName}
      />
    </td>
  ),

  name: ({ file, fileListStore }) => (
    <td key="name" className="name">
      <FileName fileStore={file} fileListStore={fileListStore} />
    </td>
  ),

  size: ({ file }) => (
    <td key="size" className="size">
      <div>{file.sizeStr}</div>
    </td>
  ),

  downloaded: ({ file }) => (
    <td key="downloaded" className="downloaded">
      <div>{file.downloadedStr}</div>
    </td>
  ),

  done: ({ file }) => {
    const isComplete = file.size === file.downloaded && file.priority !== 0;
    const progressClass = isComplete ? 'complete' : 'downloading';
    return (
      <td key="done" className="done">
        <ProgressBar progressStr={file.progressStr} progressClass={progressClass} />
      </td>
    );
  },

  prio: ({ file }) => (
    <td key="prio" className="prio">
      <div>{file.priorityStr}</div>
    </td>
  ),
};

interface FileNameProps {
  fileStore: FileItem;
  fileListStore: FileListStore;
}

const FileName: React.FC<FileNameProps> = React.memo(({ fileStore, fileListStore }) => {
  const handleSetFilter = React.useCallback(
    (level: number) => {
      let targetLevel = level;
      if (targetLevel === fileListStore.filterLevel) {
        targetLevel--;
      }
      const filter = fileStore.nameParts.slice(0, targetLevel).join('/');
      fileListStore.setFilter(filter);
    },
    [fileStore, fileListStore],
  );

  const parts: string[] = [];
  const nameParts = fileStore.nameParts;
  const filterLevel = fileListStore.filterLevel;

  for (let i = filterLevel; i < nameParts.length; i++) {
    parts.push(nameParts[i]);
  }

  const filename = parts.pop();
  const links = parts.map((name, index) => (
    <FileNamePart
      key={name}
      onSetFilter={handleSetFilter}
      level={filterLevel + index + 1}
      name={name}
    />
  ));

  if (filterLevel > 0) {
    const name = '\u2190';
    links.unshift(
      <FileNamePart key={name} onSetFilter={handleSetFilter} level={filterLevel} name={name} />,
    );
  }

  return (
    <div title={fileStore.shortName}>
      <span>
        {links}
        {filename}
      </span>
    </div>
  );
});

interface FileNamePartProps {
  level: number;
  name: string;
  onSetFilter: (level: number) => void;
}

const FileNamePart = React.memo<FileNamePartProps>(({ level, name, onSetFilter }) => {
  const handleClick = React.useCallback(() => {
    onSetFilter(level);
  }, [level, onSetFilter]);

  const classList = ['folder', `c${level - 1}`];

  return (
    <button onClick={handleClick} className={classList.join(' ')} type="button">
      {name}
    </button>
  );
});

export default fileColumnRenderers;
