import React, { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react';
import useRootStore from '../../hooks/useRootStore';

interface Settings {
  blocklistEnabled: boolean;
  blocklistUrl: string;
  blocklistSize: number;
  peerLimitGlobal: number;
  peerLimitPerTorrent: number;
  seedRatioLimit: number;
  seedRatioLimited: boolean;
  idleSeedingLimit: number;
  idleSeedingLimitEnabled: boolean;
  peerPort: number;
  portForwardingEnabled: boolean;
  encryption: string;
  dhtEnabled: boolean;
  pexEnabled: boolean;
  lpdEnabled: boolean;
  utpEnabled: boolean;
}

interface ClientStore {
  settings: Settings | null;
  updateSettings: () => Promise<unknown>;
  setBlocklistEnabled: (enabled: boolean) => Promise<unknown>;
  setBlocklistUrl: (url: string) => Promise<unknown>;
  blocklistUpdate: () => Promise<{ blocklistSize: number }>;
  setPeerLimitGlobal: (limit: number) => Promise<unknown>;
  setPeerLimitPerTorrent: (limit: number) => Promise<unknown>;
  setSeedRatioLimited: (enabled: boolean) => Promise<unknown>;
  setSeedRatioLimit: (limit: number) => Promise<unknown>;
  setIdleSeedingLimitEnabled: (enabled: boolean) => Promise<unknown>;
  setIdleSeedingLimit: (limit: number) => Promise<unknown>;
  setPeerPort: (port: number) => Promise<unknown>;
  setPortForwardingEnabled: (enabled: boolean) => Promise<unknown>;
  setEncryption: (mode: string) => Promise<unknown>;
  setDhtEnabled: (enabled: boolean) => Promise<unknown>;
  setPexEnabled: (enabled: boolean) => Promise<unknown>;
  setLpdEnabled: (enabled: boolean) => Promise<unknown>;
  setUtpEnabled: (enabled: boolean) => Promise<unknown>;
}

interface RootStore {
  client: ClientStore;
}

const ServerOptions = observer(() => {
  const rootStore = useRootStore() as unknown as RootStore;
  const settings = rootStore.client.settings;
  const [url, setUrl] = useState('');
  const [urlLoaded, setUrlLoaded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchSettings = useCallback(() => {
    setLoading(true);
    setError(false);
    rootStore.client.updateSettings().then(
      () => setLoading(false),
      () => {
        setLoading(false);
        setError(true);
      },
    );
  }, [rootStore.client]);

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [fetchSettings, settings]);

  if (!settings) {
    return (
      <div className="page server">
        <h2>{chrome.i18n.getMessage('optServer')}</h2>
        {loading && <div className="loading-inline" />}
        {error && (
          <div>
            <p>{chrome.i18n.getMessage('checkSettings')}</p>
            <button type="button" onClick={fetchSettings}>
              {chrome.i18n.getMessage('errorRetry')}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!urlLoaded) {
    setUrl(settings.blocklistUrl);
    setUrlLoaded(true);
  }

  const handleToggle =
    (setter: (enabled: boolean) => Promise<unknown>, current: boolean) => () => {
      setter(!current);
    };

  const handleNumberBlur =
    (setter: (value: number) => Promise<unknown>) =>
    (e: React.FocusEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (Number.isFinite(val) && val > 0) {
        setter(val);
      }
    };

  const handleIntBlur =
    (setter: (value: number) => Promise<unknown>) =>
    (e: React.FocusEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (Number.isFinite(val) && val > 0) {
        setter(val);
      }
    };

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  }, []);

  const handleApplyUrl = useCallback(() => {
    rootStore.client.setBlocklistUrl(url);
  }, [rootStore.client, url]);

  const handleUpdate = useCallback(() => {
    setUpdating(true);
    rootStore.client.blocklistUpdate().then(
      () => setUpdating(false),
      () => setUpdating(false),
    );
  }, [rootStore.client]);

  const handleEncryptionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      rootStore.client.setEncryption(e.target.value);
    },
    [rootStore.client],
  );

  return (
    <div className="page server">
      <h2>{chrome.i18n.getMessage('optServer')}</h2>

      <h3>{chrome.i18n.getMessage('peerSettings')}</h3>

      <label>
        <span>{chrome.i18n.getMessage('peerLimitGlobal')}</span>
        <input
          type="number"
          min="1"
          defaultValue={settings.peerLimitGlobal}
          onBlur={handleIntBlur(rootStore.client.setPeerLimitGlobal)}
        />
      </label>

      <label>
        <span>{chrome.i18n.getMessage('peerLimitPerTorrent')}</span>
        <input
          type="number"
          min="1"
          defaultValue={settings.peerLimitPerTorrent}
          onBlur={handleIntBlur(rootStore.client.setPeerLimitPerTorrent)}
        />
      </label>

      <h3>{chrome.i18n.getMessage('seedingSettings')}</h3>

      <label>
        <span>{chrome.i18n.getMessage('seedRatioLimited')}</span>
        <span className="toggle-switch">
          <input
            onChange={handleToggle(
              rootStore.client.setSeedRatioLimited,
              settings.seedRatioLimited,
            )}
            type="checkbox"
            checked={settings.seedRatioLimited}
          />
          <span className="toggle-slider"></span>
        </span>
      </label>

      {settings.seedRatioLimited && (
        <label>
          <span>{chrome.i18n.getMessage('seedRatioLimit')}</span>
          <input
            type="number"
            min="0"
            step="0.1"
            defaultValue={settings.seedRatioLimit}
            onBlur={handleNumberBlur(rootStore.client.setSeedRatioLimit)}
          />
        </label>
      )}

      <label>
        <span>{chrome.i18n.getMessage('idleSeedingLimitEnabled')}</span>
        <span className="toggle-switch">
          <input
            onChange={handleToggle(
              rootStore.client.setIdleSeedingLimitEnabled,
              settings.idleSeedingLimitEnabled,
            )}
            type="checkbox"
            checked={settings.idleSeedingLimitEnabled}
          />
          <span className="toggle-slider"></span>
        </span>
      </label>

      {settings.idleSeedingLimitEnabled && (
        <label>
          <span>{chrome.i18n.getMessage('idleSeedingLimit')}</span>
          <input
            type="number"
            min="1"
            defaultValue={settings.idleSeedingLimit}
            onBlur={handleIntBlur(rootStore.client.setIdleSeedingLimit)}
          />{' '}
          <span>{chrome.i18n.getMessage('minutes')}</span>
        </label>
      )}

      <h3>{chrome.i18n.getMessage('networkSettings')}</h3>

      <label>
        <span>{chrome.i18n.getMessage('peerPort')}</span>
        <input
          type="number"
          min="1"
          max="65535"
          defaultValue={settings.peerPort}
          onBlur={handleIntBlur(rootStore.client.setPeerPort)}
        />
      </label>

      <label>
        <span>{chrome.i18n.getMessage('portForwardingEnabled')}</span>
        <span className="toggle-switch">
          <input
            onChange={handleToggle(
              rootStore.client.setPortForwardingEnabled,
              settings.portForwardingEnabled,
            )}
            type="checkbox"
            checked={settings.portForwardingEnabled}
          />
          <span className="toggle-slider"></span>
        </span>
      </label>

      <label>
        <span>{chrome.i18n.getMessage('encryption')}</span>
        <select value={settings.encryption} onChange={handleEncryptionChange}>
          <option value="required">{chrome.i18n.getMessage('encryptionRequired')}</option>
          <option value="preferred">{chrome.i18n.getMessage('encryptionPreferred')}</option>
          <option value="tolerated">{chrome.i18n.getMessage('encryptionTolerated')}</option>
        </select>
      </label>

      <label>
        <span>{chrome.i18n.getMessage('dhtEnabled')}</span>
        <span className="toggle-switch">
          <input
            onChange={handleToggle(rootStore.client.setDhtEnabled, settings.dhtEnabled)}
            type="checkbox"
            checked={settings.dhtEnabled}
          />
          <span className="toggle-slider"></span>
        </span>
      </label>

      <label>
        <span>{chrome.i18n.getMessage('pexEnabled')}</span>
        <span className="toggle-switch">
          <input
            onChange={handleToggle(rootStore.client.setPexEnabled, settings.pexEnabled)}
            type="checkbox"
            checked={settings.pexEnabled}
          />
          <span className="toggle-slider"></span>
        </span>
      </label>

      <label>
        <span>{chrome.i18n.getMessage('lpdEnabled')}</span>
        <span className="toggle-switch">
          <input
            onChange={handleToggle(rootStore.client.setLpdEnabled, settings.lpdEnabled)}
            type="checkbox"
            checked={settings.lpdEnabled}
          />
          <span className="toggle-slider"></span>
        </span>
      </label>

      <label>
        <span>{chrome.i18n.getMessage('utpEnabled')}</span>
        <span className="toggle-switch">
          <input
            onChange={handleToggle(rootStore.client.setUtpEnabled, settings.utpEnabled)}
            type="checkbox"
            checked={settings.utpEnabled}
          />
          <span className="toggle-slider"></span>
        </span>
      </label>

      <h3>{chrome.i18n.getMessage('blocklist')}</h3>

      <label>
        <span>{chrome.i18n.getMessage('blocklistEnable')}</span>
        <span className="toggle-switch">
          <input
            onChange={handleToggle(
              rootStore.client.setBlocklistEnabled,
              settings.blocklistEnabled,
            )}
            type="checkbox"
            checked={settings.blocklistEnabled}
          />
          <span className="toggle-slider"></span>
        </span>
      </label>

      <label>
        <span>{chrome.i18n.getMessage('blocklistUrl')}</span>
        <div className="blocklist-url-row">
          <input type="text" value={url} onChange={handleUrlChange} placeholder="https://..." />
          <button type="button" onClick={handleApplyUrl}>
            {chrome.i18n.getMessage('DLG_BTN_APPLY')}
          </button>
        </div>
      </label>

      <label>
        <span>
          {chrome.i18n.getMessage('blocklistRules')}: {settings.blocklistSize.toLocaleString()}
        </span>
      </label>

      <label>
        <button type="button" onClick={handleUpdate} disabled={updating}>
          {updating ? '...' : chrome.i18n.getMessage('blocklistUpdateNow')}
        </button>
      </label>
    </div>
  );
});

export default ServerOptions;
