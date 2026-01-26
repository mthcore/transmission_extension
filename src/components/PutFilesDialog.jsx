import React, {useContext, useCallback, useEffect} from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import RootStoreCtx from "../tools/RootStoreCtx";
import showError from "../tools/showError";

const PutFilesDialog = observer(({dialogStore}) => {
  const rootStore = useContext(RootStoreCtx);
  const folders = rootStore.config.folders;
  const hasDirectorySelect = folders.length > 0;

  const handleSubmit = useCallback((e) => {
    let directory = undefined;
    if (e) {
      e.preventDefault();
      const form = e.currentTarget;

      if (form.elements.directory) {
        const directoryIndex = parseInt(form.elements.directory.value, 10);
        if (directoryIndex > -1) {
          directory = rootStore.config.folders[directoryIndex];
        }
      }
    }

    const files = dialogStore.files;
    const urls = files.map(file => URL.createObjectURL(file));

    rootStore.client.sendFiles(urls, directory).catch((err) => {
      showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to send files', err);
    });

    dialogStore.close();
  }, [rootStore, dialogStore]);

  const handleClose = useCallback((e) => {
    e && e.preventDefault();
    dialogStore.close();
  }, [dialogStore]);

  // Auto-submit when no directory selection is needed
  useEffect(() => {
    if (!hasDirectorySelect) {
      handleSubmit();
    }
  }, []);

  let directorySelect = null;
  if (hasDirectorySelect) {
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
          {directorySelect}
          <div className="nf-subItem">
            <input type="submit" value={chrome.i18n.getMessage('DLG_BTN_OK')}
                   autoFocus={true}/>
            <input onClick={handleClose} type="button" value={chrome.i18n.getMessage('DLG_BTN_CANCEL')}/>
          </div>
        </form>
      </div>
    </Dialog>
  );
});

PutFilesDialog.propTypes = {
  dialogStore: PropTypes.object.isRequired,
};

export default PutFilesDialog;
