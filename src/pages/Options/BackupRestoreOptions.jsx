import React, {useState, useCallback, useRef, useEffect} from "react";
import getLogger from "../../tools/getLogger";
import storageGet from "../../tools/storageGet";
import storageSet from "../../tools/storageSet";
import storageRemove from "../../tools/storageRemove";
import {migrateConfig} from "../../tools/loadConfig";

const logger = getLogger('BackupRestoreOptions');

const BackupRestoreOptions = () => {
  const refPage = useRef(null);
  const refData = useRef(null);

  const [loadState, setLoadState] = useState('idle'); // idle, pending, done, error
  const [saveState, setSaveState] = useState('idle'); // idle, pending, done, error
  const [restoreState, setRestoreState] = useState('idle'); // idle, pending, done, error
  const [hasCloudData, setHasCloudData] = useState(false);
  const [storage, setStorage] = useState(null);

  const checkCloudData = useCallback(() => {
    storageGet({backup: ''}, 'sync').then((storage) => {
      if (!refPage.current) return;
      setHasCloudData(!!storage.backup);
    }, (err) => {
      logger.error('checkCloudData error', err);
    });
  }, []);

  const handleLoadConfig = useCallback((e) => {
    e && e.preventDefault();
    setLoadState('pending');
    storageGet().then((storage) => {
      if (!refPage.current) return;
      setLoadState('done');
      setStorage(JSON.stringify(storage, null, 2));
    }, (err) => {
      if (!refPage.current) return;
      setLoadState('error');
      setStorage('');
    });
  }, []);

  useEffect(() => {
    handleLoadConfig();
    checkCloudData();
  }, []);

  const handleSaveToCloud = useCallback((e) => {
    e.preventDefault();
    setSaveState('pending');
    storageSet({backup: refData.current.value}, 'sync').then(() => {
      if (!refPage.current) return;
      setSaveState('done');
      setHasCloudData(true);
      setTimeout(() => {
        if (!refPage.current) return;
        setSaveState('idle');
      }, 2000);
    }, (err) => {
      logger.error('handleSaveToCloud error', err);
      if (!refPage.current) return;
      setSaveState('error');
    });
  }, []);

  const handleLoadFromCloud = useCallback((e) => {
    e.preventDefault();
    storageGet({backup: ''}, 'sync').then((storage) => {
      if (!refPage.current) return;
      if (storage.backup) {
        refData.current.value = storage.backup;
      }
    }, (err) => {
      logger.error('handleLoadFromCloud error', err);
    });
  }, []);

  const handleClearCloud = useCallback((e) => {
    e.preventDefault();
    storageRemove(['backup'], 'sync').then(() => {
      if (!refPage.current) return;
      setHasCloudData(false);
    }, (err) => {
      logger.error('handleClearCloud error', err);
    });
  }, []);

  const handleRestore = useCallback((e) => {
    e.preventDefault();
    setRestoreState('pending');
    Promise.resolve().then(() => {
      const config = Object.assign({configVersion: 1}, JSON.parse(refData.current.value));
      if (config.configVersion !== 2) {
        config.configVersion = 2;
        migrateConfig(config, config);
      }
      return storageSet(config);
    }).then(() => {
      if (!refPage.current) return;
      setRestoreState('done');
      setTimeout(() => {
        if (!refPage.current) return;
        setRestoreState('idle');
      }, 2000);
    }).catch((err) => {
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
          <textarea ref={refData} defaultValue={storage}/>
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
