import React, { useCallback, useState, FormEvent, ChangeEvent } from 'react';
import { observer } from 'mobx-react';
import Dialog from './Dialog';
import DirectorySelect from '../DirectorySelect';
import useRootStore from '../../hooks/useRootStore';
import showError from '../../tools/showError';
import { useDialogClose } from '../../hooks/useDialogClose';
import type { Folder } from '../../types/bg';

interface MoveDialogStore {
  close: () => void;
  directory: string;
  torrentIds: number[];
}

interface MoveDialogProps {
  dialogStore: MoveDialogStore;
}

const MoveDialog = observer(({ dialogStore }: MoveDialogProps) => {
  const rootStore = useRootStore();
  const [showCustomLocation, setShowCustomLocation] = useState(true);
  const handleClose = useDialogClose(dialogStore);
  const client = rootStore?.client;
  const config = rootStore?.config;

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;

      let location: string | null = null;

      const directorySelect = form.elements.namedItem('directory') as HTMLSelectElement | null;
      if (directorySelect) {
        const directoryIndex = parseInt(directorySelect.value, 10);
        if (directoryIndex > -2) {
          if (directoryIndex === -1) {
            location = client?.settings?.downloadDir ?? null;
          } else {
            location = (config?.folders as Folder[] | undefined)?.[directoryIndex]?.path ?? null;
          }
        }
      }

      if (location === null) {
        const locationInput = form.elements.namedItem('location') as HTMLInputElement;
        location = locationInput.value.trim();
      }

      client?.torrentSetLocation(dialogStore.torrentIds, location).catch((err) => {
        showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to move torrent', err);
      });

      dialogStore.close();
    },
    [client, config, dialogStore]
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const directoryIndex = parseInt(e.currentTarget.value, 10);
    setShowCustomLocation(directoryIndex === -2);
  }, []);

  const folders = (config?.folders as Folder[] | undefined) || [];

  let customLocation: React.ReactNode = null;
  if (showCustomLocation) {
    customLocation = (
      <div className="nf-subItem">
        <label>{chrome.i18n.getMessage('moveNewPath')}</label>
        <input type="text" name="location" defaultValue={dialogStore.directory} autoFocus />
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
            <input type="submit" value={chrome.i18n.getMessage('DLG_BTN_APPLY')} />
            <input
              onClick={handleClose}
              type="button"
              value={chrome.i18n.getMessage('DLG_BTN_CANCEL')}
            />
          </div>
        </form>
      </div>
    </Dialog>
  );
});

export default MoveDialog;
