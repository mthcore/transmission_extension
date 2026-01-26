import {observer} from "mobx-react";
import React, {useContext, useCallback} from "react";
import PropTypes from "prop-types";
import RootStoreCtx from "../tools/RootStoreCtx";
import FileContextMenu from "./FileContextMenu";

const FileListTableItem = observer(({file}) => {
  const rootStore = useContext(RootStoreCtx);
  const fileListStore = rootStore.fileList;

  const handleSelect = useCallback((e) => {
    if (!file.selected) {
      if (e.nativeEvent.shiftKey) {
        fileListStore.addMultipleSelectedId(file.name);
      } else {
        fileListStore.addSelectedId(file.name);
      }
    } else {
      fileListStore.removeSelectedId(file.name);
    }
  }, [file, fileListStore]);

  const visibleFileColumns = rootStore.config.visibleFileColumns;

  const columns = [];
  visibleFileColumns.forEach(({column: name}) => {
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
            <FileName fileListStore={fileListStore} fileStore={file}/>
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
        const lightWidth = progressNum > 0 ? `${10000 / progressNum}%` : '100%';

        columns.push(
          <td key={name} className={name}>
            <div className="progress_b">
              <div className="val">{file.progressStr}</div>
              <div className={`progress_b_i ${progressClass}`} style={{width: progressWidth}}>
                <div className="val-light" style={{width: lightWidth}}>{file.progressStr}</div>
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

  const classList = [];
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

FileListTableItem.propTypes = {
  file: PropTypes.object.isRequired,
};

const FileName = observer(({fileStore, fileListStore}) => {
  const handleSetFilter = useCallback((level) => {
    let targetLevel = level;
    if (targetLevel === fileListStore.filterLevel) {
      targetLevel--;
    }
    const filter = fileStore.nameParts.slice(0, targetLevel).join('/');
    fileListStore.setFilter(filter);
  }, [fileStore, fileListStore]);

  const parts = [];
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

FileName.propTypes = {
  fileStore: PropTypes.object.isRequired,
  fileListStore: PropTypes.object.isRequired,
};

const FileNamePart = React.memo(({level, name, onSetFilter}) => {
  const handleClick = useCallback((e) => {
    e.preventDefault();
    onSetFilter(level);
  }, [level, onSetFilter]);

  const classList = ['folder', `c${level - 1}`];

  return (
    <a onClick={handleClick} className={classList.join(' ')} href="#">{name}</a>
  );
});

FileNamePart.propTypes = {
  level: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  onSetFilter: PropTypes.func.isRequired,
};

export default FileListTableItem;