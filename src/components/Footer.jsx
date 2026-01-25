import React from "react";
import {observer} from "mobx-react";
import SpeedContextMenu from "./SpeedMenu";
import SpaceWatcher from "./SpaceWatcher";
import RootStoreCtx from "../tools/RootStoreCtx";

@observer
class Footer extends React.PureComponent {
  static contextType = RootStoreCtx;

  /**@return {RootStore}*/
  get rootStore() {
    return this.context;
  }

  handleResetDownloadSpeed = (e) => {
    e.preventDefault();

    if (this.rootStore.client.settings.altSpeedEnabled) {
      this.rootStore.client.setAltSpeedEnabled(false);
    } else {
      this.rootStore.client.setDownloadSpeedLimitEnabled(false);
    }
  };

  handleResetUploadSpeed = (e) => {
    e.preventDefault();

    if (this.rootStore.client.settings.altSpeedEnabled) {
      this.rootStore.client.setAltSpeedEnabled(false);
    } else {
      this.rootStore.client.setUploadSpeedLimitEnabled(false);
    }
  };

  handleOpenTab = (e) => {
    e.preventDefault();
    chrome.tabs.create({url: `${location.origin}${location.pathname}`});
  };

  render() {
    const {downloadSpeedStr, uploadSpeedStr} = this.rootStore.client.currentSpeedStr;

    let downloadLimit = null;
    let uploadLimit = null;
    const settings = this.rootStore.client.settings;
    if (settings) {
      if (settings.altSpeedEnabled || settings.downloadSpeedLimitEnabled) {
        let speedStr = null;
        if (settings.altSpeedEnabled) {
          speedStr = settings.altDownloadSpeedLimitStr;
        } else {
          speedStr = settings.downloadSpeedLimitStr;
        }
        downloadLimit = (
          <span onClick={this.handleResetDownloadSpeed} className="limit dl">{speedStr}</span>
        );
      }
      if (settings.altSpeedEnabled || settings.uploadSpeedLimitEnabled) {
        let speedStr = null;
        if (settings.altSpeedEnabled) {
          speedStr = settings.altUploadSpeedLimitStr;
        } else {
          speedStr = settings.uploadSpeedLimitStr;
        }
        uploadLimit = (
          <span onClick={this.handleResetUploadSpeed} className="limit up">{speedStr}</span>
        );
      }
    }

    let openInTab = null;
    if (this.rootStore.isPopup) {
      openInTab = (
        <div onClick={this.handleOpenTab} className="openInTab" title={chrome.i18n.getMessage('openInTab')}/>
      );
    }

    let spaceWatcher = null;
    if (this.rootStore.config.showFreeSpace) {
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
        <span className="status">{this.rootStore.client.lastErrorMessage}</span>
        {openInTab}
      </div>
    );
  }
}

export default Footer;
