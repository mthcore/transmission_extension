import React, {useContext, useCallback} from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import RootStoreCtx from "../tools/RootStoreCtx";
import showError from "../tools/showError";

const PutUrlDialog = observer(({dialogStore}) => {
  const rootStore = useContext(RootStoreCtx);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const url = form.elements.url.value.trim();
    if (!url) return;

    const urls = [url];

    let directory = undefined;
    if (form.elements.directory) {
      const directoryIndex = parseInt(form.elements.directory.value, 10);
      if (directoryIndex > -1) {
        directory = rootStore.config.folders[directoryIndex];
      }
    }

    rootStore.client.sendFiles(urls, directory).catch((err) => {
      showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to add torrent', err);
    });

    dialogStore.close();
  }, [rootStore, dialogStore]);

  const handleClose = useCallback((e) => {
    e && e.preventDefault();
    dialogStore.close();
  }, [dialogStore]);

  let directorySelect = null;
  const folders = rootStore.config.folders;
  if (folders.length) {
    directorySelect = (
      <div className="nf-subItem">
        <label>{chrome.i18n.getMessage('path')}</label>
        <select name="directory">
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

  return (
    <Dialog onClose={handleClose}>
      <div className="nf-notifi">
        <form onSubmit={handleSubmit}>
          <div className="nf-subItem">
            <label>{chrome.i18n.getMessage('Paste_a_torrent_URL')}</label>
            <input type="text" name="url" autoFocus={true} required={true}/>
          </div>
          {directorySelect}
          <div className="nf-subItem">
            <input type="submit" value={chrome.i18n.getMessage('DLG_BTN_OK')}/>
            <input onClick={handleClose} type="button" value={chrome.i18n.getMessage('DLG_BTN_CANCEL')}/>
          </div>
        </form>
      </div>
    </Dialog>
  );
});

PutUrlDialog.propTypes = {
  dialogStore: PropTypes.object.isRequired,
};

export default PutUrlDialog;
