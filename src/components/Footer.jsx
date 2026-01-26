import React, {useContext, useCallback} from "react";
import {observer} from "mobx-react";
import SpeedContextMenu from "./SpeedMenu";
import SpaceWatcher from "./SpaceWatcher";
import RootStoreCtx from "../tools/RootStoreCtx";

const Footer = observer(() => {
  const rootStore = useContext(RootStoreCtx);

  const handleResetDownloadSpeed = useCallback((e) => {
    e.preventDefault();
    if (rootStore.client.settings.altSpeedEnabled) {
      rootStore.client.setAltSpeedEnabled(false);
    } else {
      rootStore.client.setDownloadSpeedLimitEnabled(false);
    }
  }, [rootStore]);

  const handleResetUploadSpeed = useCallback((e) => {
    e.preventDefault();
    if (rootStore.client.settings.altSpeedEnabled) {
      rootStore.client.setAltSpeedEnabled(false);
    } else {
      rootStore.client.setUploadSpeedLimitEnabled(false);
    }
  }, [rootStore]);

  const handleOpenTab = useCallback((e) => {
    e.preventDefault();
    chrome.tabs.create({url: `${location.origin}${location.pathname}`});
  }, []);

  const {downloadSpeedStr, uploadSpeedStr} = rootStore.client.currentSpeedStr;

  let downloadLimit = null;
  let uploadLimit = null;
  const settings = rootStore.client.settings;

  if (settings) {
    if (settings.altSpeedEnabled || settings.downloadSpeedLimitEnabled) {
      const speedStr = settings.altSpeedEnabled
        ? settings.altDownloadSpeedLimitStr
        : settings.downloadSpeedLimitStr;
      downloadLimit = (
        <span onClick={handleResetDownloadSpeed} className="limit dl">{speedStr}</span>
      );
    }
    if (settings.altSpeedEnabled || settings.uploadSpeedLimitEnabled) {
      const speedStr = settings.altSpeedEnabled
        ? settings.altUploadSpeedLimitStr
        : settings.uploadSpeedLimitStr;
      uploadLimit = (
        <span onClick={handleResetUploadSpeed} className="limit up">{speedStr}</span>
      );
    }
  }

  let openInTab = null;
  if (rootStore.isPopup) {
    openInTab = (
      <div onClick={handleOpenTab} className="openInTab" title={chrome.i18n.getMessage('openInTab')}/>
    );
  }

  let spaceWatcher = null;
  if (rootStore.config.showFreeSpace) {
    spaceWatcher = (
      <SpaceWatcher/>
    );
  }

  return (
    <div className="status-panel">
      {spaceWatcher}
      <SpeedContextMenu type="download">
        <span className="speed download">{downloadSpeedStr}{downloadLimit}</span>
      </SpeedContextMenu>
      <SpeedContextMenu type="upload">
        <span className="speed upload">{uploadSpeedStr}{uploadLimit}</span>
      </SpeedContextMenu>
      <span className="status">{rootStore.client.lastErrorMessage}</span>
      {openInTab}
    </div>
  );
});

export default Footer;
