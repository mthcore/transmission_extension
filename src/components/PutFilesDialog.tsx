import React, { useContext, useCallback, useEffect, useRef, FormEvent, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import Dialog from './Dialog';
import DirectorySelect from './DirectorySelect';
import RootStoreCtx from '../tools/rootStoreCtx';
import showError from '../tools/showError';
import { useDialogClose } from '../hooks/useDialogClose';

interface Folder {
  name?: string;
  path: string;
}

interface PutFilesDialogStore {
  close: () => void;
  files: File[];
  setReady: (ready: boolean) => void;
}

interface PutFilesDialogProps {
  dialogStore: PutFilesDialogStore;
}

const PutFilesDialog: React.FC<PutFilesDialogProps> = observer(({ dialogStore }) => {
  const rootStore = useContext(RootStoreCtx);
  const config = rootStore?.config;
  const client = rootStore?.client;
  const folders = (config?.folders as Folder[] | undefined) ?? [];
  const hasDirectorySelect = folders.length > 0;
  const autoSubmittedRef = useRef(false);
  const handleClose = useDialogClose(dialogStore);

  const handleSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      let directory: Folder | undefined = undefined;
      if (e) {
        e.preventDefault();
        const form = e.currentTarget;

        const directorySelect = form.elements.namedItem('directory') as HTMLSelectElement | null;
        if (directorySelect) {
          const directoryIndex = parseInt(directorySelect.value, 10);
          if (directoryIndex > -1 && config?.folders) {
            directory = config.folders[directoryIndex] as Folder;
          }
        }
      }

      const files = dialogStore.files;
      const urls = files.map((file: File) => URL.createObjectURL(file));

      client?.sendFiles(urls, directory?.path ?? undefined).catch((err) => {
        showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to send files', err);
      });

      dialogStore.close();
    },
    [client, config, dialogStore]
  );

  // Auto-submit when no directory selection is needed
  useEffect(() => {
    if (!hasDirectorySelect && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      handleSubmit();
    }
  }, [hasDirectorySelect, handleSubmit]);

  const directorySelect = hasDirectorySelect ? <DirectorySelect folders={folders} /> : null;

  return (
    <Dialog onClose={handleClose}>
      <div className="nf-notifi">
        <form onSubmit={handleSubmit}>
          {directorySelect}
          <div className="nf-subItem">
            <input type="submit" value={chrome.i18n.getMessage('DLG_BTN_OK')} autoFocus />
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

export default PutFilesDialog;
