import React, { useCallback, ChangeEvent } from "react";
import { observer } from "mobx-react";
import { useOptionsPage } from "../../hooks/useOptionsPage";

interface ConfigStore {
  theme: string;
  showFreeSpace: boolean;
  hideSeedingTorrents: boolean;
  hideFinishedTorrents: boolean;
  showSpeedGraph: boolean;
  uiUpdateInterval: number;
  setTheme: (theme: string) => void;
}

const UiOptions: React.FC = observer(() => {
  const { configStore, handleChange, handleSetInt } = useOptionsPage();
  const typedConfigStore = configStore as unknown as ConfigStore;

  const handleThemeChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    typedConfigStore.setTheme(e.target.value);
  }, [typedConfigStore]);

  return (
    <div className="page main">
      <h2>{chrome.i18n.getMessage('optMain')}</h2>
      <label>
        <span>{chrome.i18n.getMessage('theme')}</span>
        <select value={typedConfigStore.theme} onChange={handleThemeChange}>
          <option value="system">{chrome.i18n.getMessage('themeSystem')}</option>
          <option value="light">{chrome.i18n.getMessage('themeLight')}</option>
          <option value="dark">{chrome.i18n.getMessage('themeDark')}</option>
        </select>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('showFreeSpace')}</span>
        <span className="toggle-switch">
          <input onChange={handleChange} name="showFreeSpace" type="checkbox" defaultChecked={typedConfigStore.showFreeSpace} />
          <span className="toggle-slider"></span>
        </span>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('hideSeedStatusItem')}</span>
        <span className="toggle-switch">
          <input onChange={handleChange} name="hideSeedingTorrents" type="checkbox" defaultChecked={typedConfigStore.hideSeedingTorrents} />
          <span className="toggle-slider"></span>
        </span>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('hideFinishStatusItem')}</span>
        <span className="toggle-switch">
          <input onChange={handleChange} name="hideFinishedTorrents" type="checkbox" defaultChecked={typedConfigStore.hideFinishedTorrents} />
          <span className="toggle-slider"></span>
        </span>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('showSpeedGraph')}</span>
        <span className="toggle-switch">
          <input onChange={handleChange} name="showSpeedGraph" type="checkbox" defaultChecked={typedConfigStore.showSpeedGraph} />
          <span className="toggle-slider"></span>
        </span>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('popupUpdateInterval')}</span>
        <input onChange={handleSetInt} name="uiUpdateInterval" type="number" min="100" defaultValue={typedConfigStore.uiUpdateInterval} />
        {' '}
        <span>{chrome.i18n.getMessage('ms')}</span>
      </label>
    </div>
  );
});

export default UiOptions;
