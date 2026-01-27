import React, {useContext, useCallback} from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import RootStoreCtx from "../tools/RootStoreCtx";
import showError from "../tools/showError";
import {useDialogClose} from "../hooks/useDialogClose";

const RenameDialog = observer(({dialogStore}) => {
  const rootStore = useContext(RootStoreCtx);
  const handleClose = useDialogClose(dialogStore);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const name = form.elements.name.value.trim();

    rootStore.client.rename(dialogStore.torrentIds, dialogStore.path, name).catch((err) => {
      showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to rename', err);
    });

    dialogStore.close();
  }, [rootStore, dialogStore]);

  return (
    <Dialog onClose={handleClose}>
      <div className="nf-notifi">
        <form onSubmit={handleSubmit}>
          <div className="nf-subItem">
            <label>{chrome.i18n.getMessage('renameText')}</label>
            <input type="text" name="name" defaultValue={dialogStore.name} autoFocus/>
          </div>
          <div className="nf-subItem">
            <input type="submit" value={chrome.i18n.getMessage('DLG_BTN_APPLY')}/>
            <input onClick={handleClose} type="button" value={chrome.i18n.getMessage('DLG_BTN_CANCEL')}/>
          </div>
        </form>
      </div>
    </Dialog>
  );
});

RenameDialog.propTypes = {
  dialogStore: PropTypes.object.isRequired,
};

export default RenameDialog;
