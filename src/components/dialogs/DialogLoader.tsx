import React from 'react';
import Spinner from '../Spinner';
import ErrorBoundary from '../ErrorBoundary';

const dialogComponents = {
  putFiles: React.lazy(() => import('./PutFilesDialog')),
  putUrl: React.lazy(() => import('./PutUrlDialog')),
  removeConfirm: React.lazy(() => import('./RemoveConfirmDialog')),
  rename: React.lazy(() => import('./RenameDialog')),
  copyMagnetUrl: React.lazy(() => import('./CopyMagnetUrlDialog')),
  move: React.lazy(() => import('./MoveDialog')),
  setLabels: React.lazy(() => import('./SetLabelsDialog')),
  torrentDetails: React.lazy(() => import('./TorrentDetailsDialog')),
};

type DialogType = keyof typeof dialogComponents;

interface DialogLoaderProps {
  type: string;
  dialogStore: unknown;
}

const DialogLoader = ({ type, dialogStore }: DialogLoaderProps) => {
  const Component = dialogComponents[type as DialogType];

  if (!Component) {
    console.warn(`Unknown dialog type: ${type}`);
    return null;
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="dialog-error">
          {chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to load dialog'}
        </div>
      }
    >
      <React.Suspense
        fallback={
          <div className="dialog-loading">
            <Spinner />
          </div>
        }
      >
        <Component dialogStore={dialogStore as never} />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default DialogLoader;
