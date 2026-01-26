import React, {useCallback} from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";

const CopyMagnetUrlDialog = observer(({dialogStore}) => {
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const input = form.elements.magnetLink;
    input.select();
    document.execCommand('copy');

    dialogStore.close();
  }, [dialogStore]);

  const handleClose = useCallback((e) => {
    e && e.preventDefault();
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
            <input type="submit" value={chrome.i18n.getMessage('copy')} autoFocus={true}/>
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
