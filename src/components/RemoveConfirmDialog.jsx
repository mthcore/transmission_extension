import React, {useContext, useCallback} from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import RootStoreCtx from "../tools/RootStoreCtx";
import showError from "../tools/showError";
import {useDialogClose} from "../hooks/useDialogClose";

const RemoveConfirmDialog = observer(({dialogStore}) => {
  const rootStore = useContext(RootStoreCtx);
  const handleClose = useDialogClose(dialogStore);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    rootStore.client.torrentsRemoveTorrent(dialogStore.torrentIds).catch((err) => {
      showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to remove torrent', err);
    });

    dialogStore.close();
  }, [rootStore, dialogStore]);

  let label = null;
  let filename = null;

  const count = dialogStore.torrentIds.length;
  if (count === 1) {
    const id = dialogStore.torrentIds[0];
    const torrent = rootStore.client.torrents.get(id);
    if (torrent) {
      filename = (
        <span className="fileName">{torrent.name}</span>
      );
    }

    label = (
      <label>{chrome.i18n.getMessage('OV_CONFIRM_DELETE_ONE')}</label>
    );
  } else {
    label = (
      <label>{chrome.i18n.getMessage('OV_CONFIRM_DELETE_MULTIPLE').replace('%d', count)}</label>
    );
  }

  return (
    <Dialog onClose={handleClose}>
      <div className="nf-notifi">
        <form onSubmit={handleSubmit}>
          <div className="nf-subItem">
            {label}
            {filename}
          </div>
          <div className="nf-subItem">
            <input type="submit" value={chrome.i18n.getMessage('DLG_BTN_YES')}/>
            <input onClick={handleClose} autoFocus type="button" value={chrome.i18n.getMessage('DLG_BTN_NO')}/>
          </div>
        </form>
      </div>
    </Dialog>
  );
});

RemoveConfirmDialog.propTypes = {
  dialogStore: PropTypes.object.isRequired,
};

export default RemoveConfirmDialog;
