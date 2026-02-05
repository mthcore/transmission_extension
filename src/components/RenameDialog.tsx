import React, { useContext, useCallback, FormEvent, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import Dialog from './Dialog';
import RootStoreCtx from '../tools/rootStoreCtx';
import showError from '../tools/showError';
import { useDialogClose } from '../hooks/useDialogClose';

interface RenameDialogStore {
  close: () => void;
  path: string;
  name: string;
  torrentIds: number[];
}

interface RenameDialogProps {
  dialogStore: RenameDialogStore;
}

const RenameDialog: React.FC<RenameDialogProps> = observer(({ dialogStore }) => {
  const rootStore = useContext(RootStoreCtx);
  const client = rootStore?.client;
  const handleClose = useDialogClose(dialogStore);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;

      const nameInput = form.elements.namedItem('name') as HTMLInputElement;
      const name = nameInput.value.trim();

      client?.rename(dialogStore.torrentIds, dialogStore.path, name).catch((err) => {
        showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to rename', err);
      });

      dialogStore.close();
    },
    [client, dialogStore]
  );

  return (
    <Dialog onClose={handleClose}>
      <div className="nf-notifi">
        <form onSubmit={handleSubmit}>
          <div className="nf-subItem">
            <label>{chrome.i18n.getMessage('renameText')}</label>
            <input type="text" name="name" defaultValue={dialogStore.name} autoFocus />
          </div>
          <div className="nf-subItem">
            <input type="submit" value={chrome.i18n.getMessage('DLG_BTN_APPLY')} />
            <input
              onClick={handleClose as unknown as (e: MouseEvent<HTMLInputElement>) => void}
              type="button"
              value={chrome.i18n.getMessage('DLG_BTN_CANCEL')}
            />
          </div>
        </form>
      </div>
    </Dialog>
  );
});

export default RenameDialog;
