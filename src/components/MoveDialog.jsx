import React, {useContext, useCallback, useState} from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import DirectorySelect from "./DirectorySelect";
import RootStoreCtx from "../tools/RootStoreCtx";
import showError from "../tools/showError";
import {useDialogClose} from "../hooks/useDialogClose";

const MoveDialog = observer(({dialogStore}) => {
  const rootStore = useContext(RootStoreCtx);
  const [showCustomLocation, setShowCustomLocation] = useState(true);
  const handleClose = useDialogClose(dialogStore);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const form = e.currentTarget;

    let location = null;

    if (form.elements.directory) {
      const directoryIndex = parseInt(form.elements.directory.value, 10);
      if (directoryIndex > -2) {
        if (directoryIndex === -1) {
          location = rootStore.client.settings?.downloadDir ?? null;
        } else {
          location = rootStore.config.folders[directoryIndex]?.path ?? null;
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

  const handleChange = useCallback((e) => {
    const directoryIndex = parseInt(e.currentTarget.value, 10);
    setShowCustomLocation(directoryIndex === -2);
  }, []);

  const folders = rootStore.config.folders;

  let customLocation = null;
  if (showCustomLocation) {
    customLocation = (
      <div className="nf-subItem">
        <label>{chrome.i18n.getMessage('moveNewPath')}</label>
        <input type="text" name="location" defaultValue={dialogStore.directory} autoFocus/>
      </div>
    );
  }

  return (
    <Dialog onClose={handleClose}>
      <div className="nf-notifi">
        <form onSubmit={handleSubmit}>
          {customLocation}
          <DirectorySelect
            folders={folders}
            showCustomOption={true}
            defaultValue={-2}
            onChange={handleChange}
          />
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
