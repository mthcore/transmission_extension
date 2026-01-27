import React, { useState, useCallback, useRef, useEffect } from "react";
import getLogger from "../../tools/getLogger";
import storageGet from "../../tools/storageGet";
import storageSet from "../../tools/storageSet";
import storageRemove from "../../tools/storageRemove";
import { migrateConfig } from "../../tools/loadConfig";

const logger = getLogger('BackupRestoreOptions');

type LoadState = 'idle' | 'pending' | 'done' | 'error';
type SaveState = 'idle' | 'pending' | 'done' | 'error';
type RestoreState = 'idle' | 'pending' | 'done' | 'error';

interface StorageData {
  backup?: string;
  configVersion?: number;
  [key: string]: unknown;
}

const BackupRestoreOptions: React.FC = () => {
  const refPage = useRef<HTMLDivElement>(null);
  const refData = useRef<HTMLTextAreaElement>(null);

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [restoreState, setRestoreState] = useState<RestoreState>('idle');
  const [hasCloudData, setHasCloudData] = useState(false);
  const [storage, setStorage] = useState<string | null>(null);

  const checkCloudData = useCallback(() => {
    storageGet({ backup: '' }, 'sync').then((storage: StorageData) => {
      if (!refPage.current) return;
      setHasCloudData(!!storage.backup);
    }, (err: Error) => {
      logger.error('checkCloudData error', err);
    });
  }, []);

  const handleLoadConfig = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    e && e.preventDefault();
    setLoadState('pending');
    storageGet(null).then((storage: StorageData) => {
      if (!refPage.current) return;
      setLoadState('done');
      setStorage(JSON.stringify(storage, null, 2));
    }, () => {
      if (!refPage.current) return;
      setLoadState('error');
      setStorage('');
    });
  }, []);

  useEffect(() => {
    handleLoadConfig();
    checkCloudData();
  }, []);

  const handleSaveToCloud = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setSaveState('pending');
    storageSet({ backup: refData.current?.value }, 'sync').then(() => {
      if (!refPage.current) return;
      setSaveState('done');
      setHasCloudData(true);
      setTimeout(() => {
        if (!refPage.current) return;
        setSaveState('idle');
      }, 2000);
    }, (err: Error) => {
      logger.error('handleSaveToCloud error', err);
      if (!refPage.current) return;
      setSaveState('error');
    });
  }, []);

  const handleLoadFromCloud = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    storageGet({ backup: '' }, 'sync').then((storage: StorageData) => {
      if (!refPage.current) return;
      if (storage.backup && refData.current) {
        refData.current.value = storage.backup;
      }
    }, (err: Error) => {
      logger.error('handleLoadFromCloud error', err);
    });
  }, []);

  const handleClearCloud = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const confirmMessage = chrome.i18n.getMessage('confirmClearCloud') || 'Are you sure you want to clear the cloud backup?';
    if (!window.confirm(confirmMessage)) return;
    storageRemove(['backup'], 'sync').then(() => {
      if (!refPage.current) return;
      setHasCloudData(false);
    }, (err: Error) => {
      logger.error('handleClearCloud error', err);
    });
  }, []);

  const handleRestore = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const confirmMessage = chrome.i18n.getMessage('confirmRestore') || 'Are you sure you want to restore this configuration? This will overwrite all current settings.';
    if (!window.confirm(confirmMessage)) return;
    setRestoreState('pending');
    Promise.resolve().then(() => {
      const config: StorageData = Object.assign({ configVersion: 1 }, JSON.parse(refData.current?.value || '{}'));
      if (config.configVersion !== 2) {
        config.configVersion = 2;
        migrateConfig(config as Record<string, unknown>, config as Record<string, unknown>);
      }
      return storageSet(config);
    }).then(() => {
      if (!refPage.current) return;
      setRestoreState('done');
      setTimeout(() => {
        if (!refPage.current) return;
        setRestoreState('idle');
      }, 2000);
    }).catch((err: Error) => {
      logger.error('handleRestore error', err);
      if (!refPage.current) return;
      setRestoreState('error');
    });
  }, []);

  return (
    <div ref={refPage} className="page backup-restore">
      <h2>{chrome.i18n.getMessage('backupRestore')}</h2>

      <div className="backup-section">
        <h3>{chrome.i18n.getMessage('backup')}</h3>
        <p className="section-hint">{chrome.i18n.getMessage('backupHint')}</p>
        <div className="backup-actions">
          <button type="button" onClick={handleLoadConfig} disabled={loadState === 'pending'}>
            {loadState === 'pending' ? '...' : chrome.i18n.getMessage('loadCurrentConfig')}
          </button>
          <button type="button" onClick={handleSaveToCloud} disabled={loadState !== 'done' || saveState === 'pending'}>
            {saveState === 'pending' ? '...' : saveState === 'done' ? '✓' : chrome.i18n.getMessage('optSaveInCloud')}
          </button>
        </div>
      </div>

      <div className="backup-section">
        <h3>{chrome.i18n.getMessage('configData')}</h3>
        {loadState === 'done' ? (
          <textarea ref={refData} defaultValue={storage || ''} />
        ) : loadState === 'pending' ? (
          <div className="loading-inline"></div>
        ) : loadState === 'error' ? (
          <p className="red">{chrome.i18n.getMessage('OV_FL_ERROR')}</p>
        ) : (
          <p className="section-hint">{chrome.i18n.getMessage('clickLoadConfig')}</p>
        )}
      </div>

      <div className="backup-section">
        <h3>{chrome.i18n.getMessage('restore')}</h3>
        <p className="section-hint">{chrome.i18n.getMessage('restoreHint')}</p>
        <div className="backup-actions">
          <button type="button" onClick={handleRestore} disabled={loadState !== 'done' || restoreState === 'pending'}>
            {restoreState === 'pending' ? '...' : restoreState === 'done' ? '✓' : chrome.i18n.getMessage('toRestore')}
          </button>
          <button type="button" onClick={handleLoadFromCloud} disabled={!hasCloudData}>
            {chrome.i18n.getMessage('optGetFromCloud')}
          </button>
          <button type="button" onClick={handleClearCloud} disabled={!hasCloudData}>
            {chrome.i18n.getMessage('optClearCloudStorage')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupRestoreOptions;
