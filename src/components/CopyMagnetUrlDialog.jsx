import React, {useCallback} from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import {useDialogClose} from "../hooks/useDialogClose";

const CopyMagnetUrlDialog = observer(({dialogStore}) => {
  const handleClose = useDialogClose(dialogStore);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const magnetLink = form.elements.magnetLink.value;
    navigator.clipboard.writeText(magnetLink);

    dialogStore.close();
  }, [dialogStore]);

  return (
    <Dialog onClose={handleClose}>
      <div className="nf-notifi">
        <form onSubmit={handleSubmit}>
          <div className="nf-subItem">
            <label>{chrome.i18n.getMessage('magnetUri')}</label>
            <input type="text" name="magnetLink" defaultValue={dialogStore.magnetLink}/>
          </div>
          <div className="nf-subItem">
            <input type="submit" value={chrome.i18n.getMessage('copy')} autoFocus/>
            <input onClick={handleClose} type="button" value={chrome.i18n.getMessage('DLG_BTN_CLOSE')}/>
          </div>
        </form>
      </div>
    </Dialog>
  );
});

CopyMagnetUrlDialog.propTypes = {
  dialogStore: PropTypes.object.isRequired,
};

export default CopyMagnetUrlDialog;
