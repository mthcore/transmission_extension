import React, {useContext, useCallback, useEffect, useRef} from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import DirectorySelect from "./DirectorySelect";
import RootStoreCtx from "../tools/RootStoreCtx";
import showError from "../tools/showError";
import {useDialogClose} from "../hooks/useDialogClose";

const PutFilesDialog = observer(({dialogStore}) => {
  const rootStore = useContext(RootStoreCtx);
  const folders = rootStore.config.folders;
  const hasDirectorySelect = folders.length > 0;
  const autoSubmittedRef = useRef(false);
  const handleClose = useDialogClose(dialogStore);

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

  // Auto-submit when no directory selection is needed
  useEffect(() => {
    if (!hasDirectorySelect && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      handleSubmit();
    }
  }, [hasDirectorySelect, handleSubmit]);

  const directorySelect = hasDirectorySelect ? (
    <DirectorySelect folders={folders} />
  ) : null;

  return (
    <Dialog onClose={handleClose}>
      <div className="nf-notifi">
        <form onSubmit={handleSubmit}>
          {directorySelect}
          <div className="nf-subItem">
            <input type="submit" value={chrome.i18n.getMessage('DLG_BTN_OK')}
                   autoFocus/>
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
