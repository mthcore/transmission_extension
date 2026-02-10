import React, { useCallback, FormEvent } from 'react';
import { observer } from 'mobx-react';
import Dialog from './Dialog';
import { useDialogClose } from '../hooks/useDialogClose';

interface CopyMagnetUrlDialogStore {
  close: () => void;
  magnetLink: string;
}

interface CopyMagnetUrlDialogProps {
  dialogStore: CopyMagnetUrlDialogStore;
}

const CopyMagnetUrlDialog: React.FC<CopyMagnetUrlDialogProps> = observer(({ dialogStore }) => {
  const handleClose = useDialogClose(dialogStore);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;

      const magnetLinkInput = form.elements.namedItem('magnetLink') as HTMLInputElement;
      const magnetLink = magnetLinkInput.value;
      navigator.clipboard.writeText(magnetLink);

      dialogStore.close();
    },
    [dialogStore]
  );

  return (
    <Dialog onClose={handleClose}>
      <div className="nf-notifi">
        <form onSubmit={handleSubmit}>
          <div className="nf-subItem">
            <label>{chrome.i18n.getMessage('magnetUri')}</label>
            <input type="text" name="magnetLink" defaultValue={dialogStore.magnetLink} />
          </div>
          <div className="nf-subItem">
            <input type="submit" value={chrome.i18n.getMessage('copy')} autoFocus />
            <input
              onClick={handleClose}
              type="button"
              value={chrome.i18n.getMessage('DLG_BTN_CLOSE')}
            />
          </div>
        </form>
      </div>
    </Dialog>
  );
});

export default CopyMagnetUrlDialog;
