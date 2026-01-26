import React, {useContext, useCallback, useState} from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import RootStoreCtx from "../tools/RootStoreCtx";
import showError from "../tools/showError";

const MoveDialog = observer(({dialogStore}) => {
  const rootStore = useContext(RootStoreCtx);
  const [showCustomLocation, setShowCustomLocation] = useState(true);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const form = e.currentTarget;

    let location = null;

    if (form.elements.directory) {
      const directoryIndex = parseInt(form.elements.directory.value, 10);
      if (directoryIndex > -2) {
        if (directoryIndex === -1) {
          location = rootStore.client.settings.downloadDir;
        } else {
          location = rootStore.config.folders[directoryIndex].path;
        }
      }
    }

    if (location === null) {
      location = form.elements.location.value.trim();
    }

    rootStore.client.torrentSetLocation(dialogStore.torrentIds, location).catch((err) => {
      showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to move torrent', err);
    });

    dialogStore.close();
  }, [rootStore, dialogStore]);

  const handleClose = useCallback((e) => {
    e && e.preventDefault();
    dialogStore.close();
  }, [dialogStore]);

  const handleChange = useCallback((e) => {
    const directoryIndex = parseInt(e.currentTarget.value, 10);
    setShowCustomLocation(directoryIndex === -2);
  }, []);

  let directorySelect = null;
  const folders = rootStore.config.folders;
  if (folders.length) {
    directorySelect = (
      <div className="nf-subItem">
        <label>{chrome.i18n.getMessage('path')}</label>
        <select onChange={handleChange} name="directory" defaultValue={-2}>
          <option value={-2}/>
          <option value={-1}>{chrome.i18n.getMessage('defaultPath')}</option>
          {folders.map((folder, index) => {
            return (
              <option key={`option-${index}`} value={index}>{folder.name || folder.path}</option>
            );
          })}
        </select>
      </div>
    );
  }

  let customLocation = null;
  if (showCustomLocation) {
    customLocation = (
      <div className="nf-subItem">
        <label>{chrome.i18n.getMessage('moveNewPath')}</label>
        <input type="text" name="location" defaultValue={dialogStore.directory} autoFocus={true}/>
      </div>
    );
  }

  return (
    <Dialog onClose={handleClose}>
      <div className="nf-notifi">
        <form onSubmit={handleSubmit}>
          {customLocation}
          {directorySelect}
          <div className="nf-subItem">
            <input type="submit" value={chrome.i18n.getMessage('DLG_BTN_APPLY')}/>
            <input onClick={handleClose} type="button" value={chrome.i18n.getMessage('DLG_BTN_CANCEL')}/>
          </div>
        </form>
      </div>
    </Dialog>
  );
});

MoveDialog.propTypes = {
  dialogStore: PropTypes.object.isRequired,
};

export default MoveDialog;
