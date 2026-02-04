import "rc-select/assets/index.css";
import "../assets/css/stylesheet.scss";
import React from "react";
import Menu from "../components/Menu";
import { observer } from "mobx-react";
import { reaction } from "mobx";
import { createRoot } from "react-dom/client";
import RootStore from "../stores/RootStore";
import TorrentListTable from "../components/TorrentListTable";
import FileListTable from "../components/FileListTable";
import Footer from "../components/Footer";
import Interval from "../components/Interval";
import getLogger from "../tools/getLogger";
import RootStoreCtx from "../tools/rootStoreCtx";
import { useTheme } from "../hooks/useTheme";
import DialogLoader from "../components/DialogLoader";

const logger = getLogger('Index');

interface DialogStore {
  id: string;
  type: string;
  isReady?: boolean;
}

interface RootStoreType {
  state: string;
  isPopup: boolean;
  config: {
    uiUpdateInterval: number;
    hostname: string;
    theme: 'light' | 'dark' | 'system' | string;
    setPopupMode: (isPopup: boolean) => void;
  };
  client: {
    updateSettings: () => Promise<void>;
    updateTorrentList: (force?: boolean) => Promise<void>;
    torrents: Map<number, { isActive: boolean; directory?: string; name: string }>;
    torrentIds: number[];
    torrentsStart: (ids: number[]) => void;
    torrentsStop: (ids: number[]) => void;
  };
  torrentList: {
    selectedIds: number[];
    toggleSelectAll: () => void;
  };
  fileList: { id: number } | null;
  dialogs: DialogStore[];
  init: () => void;
  createDialog: (options: Record<string, unknown>) => void;
  destroyDialog: (dialog: DialogStore) => void;
  setFileList: (fileList: null) => void;
}

const Index: React.FC = observer(() => {
  const rootStore = React.useContext(RootStoreCtx) as unknown as RootStoreType;

  React.useEffect(() => {
    rootStore.init();

    if (rootStore.isPopup) {
      document.body.classList.add('popup');
    }
  }, [rootStore]);

  // Set popup mode in config for column width separation (after config loads)
  React.useEffect(() => {
    const dispose = reaction(
      () => rootStore.config,
      (config) => {
        if (config) {
          config.setPopupMode(rootStore.isPopup);
        }
      },
      { fireImmediately: true }
    );
    return () => dispose();
  }, [rootStore]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus in input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      // Escape - close dialogs/filelist
      if (e.key === 'Escape') {
        if (rootStore.dialogs.length) {
          rootStore.destroyDialog(rootStore.dialogs[rootStore.dialogs.length - 1]);
        } else if (rootStore.fileList) {
          rootStore.setFileList(null);
        }
        return;
      }

      // R - Refresh
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        rootStore.client.updateTorrentList(true);
        rootStore.client.updateSettings();
        return;
      }

      // Ctrl+A - Toggle select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        rootStore.torrentList.toggleSelectAll();
        return;
      }

      // Ctrl+U - Add URL
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        rootStore.createDialog({ type: 'putUrl' });
        return;
      }

      // Delete - Remove selected
      if (e.key === 'Delete' && rootStore.torrentList.selectedIds.length) {
        rootStore.createDialog({
          type: 'removeConfirm',
          torrentIds: rootStore.torrentList.selectedIds.slice(0)
        });
        return;
      }

      // Enter - Start/Stop selected
      if (e.key === 'Enter' && rootStore.torrentList.selectedIds.length) {
        const ids = rootStore.torrentList.selectedIds;
        const firstTorrent = rootStore.client.torrents.get(ids[0]);
        if (firstTorrent?.isActive) {
          rootStore.client.torrentsStop(ids);
        } else {
          rootStore.client.torrentsStart(ids);
        }
        return;
      }

      // Ctrl+O - Add torrent file
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        rootStore.createDialog({ type: 'putFiles' });
        return;
      }

      // F2 - Rename selected torrent
      if (e.key === 'F2' && rootStore.torrentList.selectedIds.length === 1) {
        e.preventDefault();
        const id = rootStore.torrentList.selectedIds[0];
        const torrent = rootStore.client.torrents.get(id);
        if (torrent) {
          rootStore.createDialog({
            type: 'rename',
            path: torrent.name,
            torrentIds: [id]
          });
        }
        return;
      }

      // Ctrl+M - Move selected torrent
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        if (rootStore.torrentList.selectedIds.length) {
          const id = rootStore.torrentList.selectedIds[0];
          const torrent = rootStore.client.torrents.get(id);
          rootStore.createDialog({
            type: 'move',
            directory: torrent?.directory,
            torrentIds: rootStore.torrentList.selectedIds.slice(0)
          });
        }
        return;
      }

      // Ctrl+I - Show properties
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        if (rootStore.torrentList.selectedIds.length === 1) {
          rootStore.createDialog({
            type: 'torrentDetails',
            torrentId: rootStore.torrentList.selectedIds[0]
          });
        }
        return;
      }

      // Ctrl+Shift+S - Stop all
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        rootStore.client.torrentsStop(rootStore.client.torrentIds);
        return;
      }

      // Ctrl+Shift+R - Start all
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        rootStore.client.torrentsStart(rootStore.client.torrentIds);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rootStore]);

  // Theme application
  useTheme(rootStore.config);

  const onIntervalFire = React.useCallback((isInit: boolean) => {
    if (isInit) {
      rootStore.client.updateSettings().catch((err) => {
        logger.error('onIntervalFire updateSettings error', err);
      });
    }
    rootStore.client.updateTorrentList(isInit).catch((err) => {
      logger.error('onIntervalFire updateTorrentList error', err);
    });
  }, [rootStore]);

  if (['idle', 'pending'].includes(rootStore.state)) {
    return (
      <div className="loading-container">
        <div className="loading" />
      </div>
    );
  }

  if (rootStore.state !== 'done') {
    return <>{`Loading: ${rootStore.state}`}</>;
  }

  let fileList: React.ReactNode = null;
  if (rootStore.fileList) {
    fileList = (
      <FileListTable key={rootStore.fileList.id} />
    );
  }

  const uiUpdateInterval = rootStore.config.uiUpdateInterval;

  let goInOptions: React.ReactNode = null;
  if (rootStore.config.hostname === '') {
    goInOptions = (
      <GoInOptions isPopup={rootStore.isPopup} />
    );
  }

  return (
    <>
      <Interval onFire={onIntervalFire} interval={uiUpdateInterval} />
      <Menu />
      <TorrentListTable />
      <Footer />
      {fileList}
      <Dialogs />
      {goInOptions}
    </>
  );
});

const Dialogs: React.FC = observer(() => {
  const rootStore = React.useContext(RootStoreCtx) as unknown as RootStoreType;

  return (
    <>
      {Array.from(rootStore.dialogs.values()).map((dialog) => {
        // putFiles needs to wait for isReady
        if (dialog.type === 'putFiles' && !dialog.isReady) {
          return null;
        }
        return (
          <DialogLoader
            key={dialog.id}
            type={dialog.type}
            dialogStore={dialog}
          />
        );
      })}
    </>
  );
});

interface GoInOptionsProps {
  isPopup: boolean;
}

const GoInOptions = React.memo<GoInOptionsProps>(({ isPopup }) => {
  const handleOpenOptions = React.useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  React.useEffect(() => {
    // Only redirect if not in popup (e.g., opened in a tab)
    if (!isPopup) {
      location.href = '/options.html#/#redirect';
    }
  }, [isPopup]);

  // In popup mode, show a message instead of redirecting
  if (isPopup) {
    return (
      <div className="go-in-options">
        <div className="go-in-options-content">
          <h2>{chrome.i18n.getMessage('configureClient')}</h2>
          <p>{chrome.i18n.getMessage('configureClientHint')}</p>
          <button onClick={handleOpenOptions}>
            {chrome.i18n.getMessage('openOptions')}
          </button>
        </div>
      </div>
    );
  }

  return null;
});

declare global {
  interface Window {
    rootStore: ReturnType<typeof RootStore.create>;
  }
}

const rootStore = window.rootStore = RootStore.create();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
createRoot(rootElement).render(
  <RootStoreCtx.Provider value={rootStore as unknown as import('../stores/RootStore').IRootStore}>
    <Index />
  </RootStoreCtx.Provider>
);
