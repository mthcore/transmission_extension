import React, {useRef, useCallback} from "react";
import {observer} from "mobx-react";
import {useOptionsPage} from "../../hooks/useOptionsPage";

const CtxOptionsDirs = observer(({configStore, handleChange}) => {
  const refDirectorySelect = useRef(null);

  const getSelectedDirectories = useCallback(() => {
    return Array.from(refDirectorySelect.current.selectedOptions).map((option) => {
      return configStore.folders[parseInt(option.value, 10)];
    });
  }, [configStore]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const path = form.elements.path.value.trim();
    const name = form.elements.name.value.trim();
    if (!path) return;

    if (!configStore.hasFolder(path)) {
      configStore.addFolder(path, name);
      form.elements.path.value = '';
      form.elements.name.value = '';
    }
  }, [configStore]);

  const handleRemove = useCallback((e) => {
    e.preventDefault();
    configStore.removeFolders(getSelectedDirectories());
  }, [configStore, getSelectedDirectories]);

  const handleMoveUp = useCallback((e) => {
    e.preventDefault();
    configStore.moveFolders(getSelectedDirectories(), -1);
  }, [configStore, getSelectedDirectories]);

  const handleMoveDown = useCallback((e) => {
    e.preventDefault();
    configStore.moveFolders(getSelectedDirectories(), 1);
  }, [configStore, getSelectedDirectories]);

  const directories = configStore.folders.map((folder, index) => {
    let name = folder.path;
    if (folder.name) {
      name = `${folder.name} (${name})`;
    }
    return (
      <option key={JSON.stringify(folder)} value={index}>{name}</option>
    );
  });

  return (
    <div className="dir-manager">
      <h3>{chrome.i18n.getMessage('dirList')}</h3>
      <p className="section-hint">{chrome.i18n.getMessage('dirListHint')}</p>
      <form onSubmit={handleSubmit} autoComplete="off" className="dir-form">
        <div className="dir-form-row">
          <input name="path" type="text" required={true} placeholder={chrome.i18n.getMessage('subPath')}/>
          <input name="name" type="text" placeholder={chrome.i18n.getMessage('shortName')}/>
          <button type="submit">{chrome.i18n.getMessage('add')}</button>
        </div>
      </form>
      <div className="dir-list-container">
        <select ref={refDirectorySelect} id="folderList" multiple>
          {directories}
        </select>
        <div className="dir-list-actions">
          <button type="button" onClick={handleMoveUp} title={chrome.i18n.getMessage('up')}>▲</button>
          <button type="button" onClick={handleMoveDown} title={chrome.i18n.getMessage('down')}>▼</button>
          <button type="button" onClick={handleRemove} title={chrome.i18n.getMessage('deleteSelected')}>✕</button>
        </div>
      </div>
      <h3>{chrome.i18n.getMessage('options')}</h3>
      <label>
        <span>{chrome.i18n.getMessage('treeViewContextMenu')}</span>
        <span className="toggle-switch">
          <input onChange={handleChange} defaultChecked={configStore.treeViewContextMenu} type="checkbox" name="treeViewContextMenu"/>
          <span className="toggle-slider"></span>
        </span>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('showDefaultFolderContextMenuItem')}</span>
        <span className="toggle-switch">
          <input onChange={handleChange} defaultChecked={configStore.putDefaultPathInContextMenu} type="checkbox" name="putDefaultPathInContextMenu"/>
          <span className="toggle-slider"></span>
        </span>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('selectDownloadCategoryOnAddItemFromContextMenu')}</span>
        <span className="toggle-switch">
          <input onChange={handleChange} defaultChecked={configStore.selectDownloadCategoryAfterPutTorrentFromContextMenu} type="checkbox" name="selectDownloadCategoryAfterPutTorrentFromContextMenu"/>
          <span className="toggle-slider"></span>
        </span>
      </label>
    </div>
  );
});

const CtxOptions = observer(() => {
  const {configStore, handleChange} = useOptionsPage();

  return (
    <div className="page ctx">
      <h2>{chrome.i18n.getMessage('optCtx')}</h2>
      <CtxOptionsDirs configStore={configStore} handleChange={handleChange}/>
    </div>
  );
});

export default CtxOptions;
