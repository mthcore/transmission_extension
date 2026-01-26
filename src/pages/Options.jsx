import "../assets/css/options.scss";
import React from "react";
import RootStore from "../stores/RootStore";
import {createRoot} from "react-dom/client";
import {observer} from "mobx-react";
import {reaction} from "mobx";
import {HashRouter, NavLink, Navigate, Route, Routes, useLocation} from "react-router-dom";
import PropTypes from "prop-types";
import {SketchPicker} from "react-color";
import {Popover} from "react-tiny-popover";
import getLogger from "../tools/getLogger";
import storageGet from "../tools/storageGet";
import storageSet from "../tools/storageSet";
import storageRemove from "../tools/storageRemove";
import {migrateConfig} from "../tools/loadConfig";
import RootStoreCtx from "../tools/RootStoreCtx";

const logger = getLogger('Options');

@observer
class Options extends React.PureComponent {
  static contextType = RootStoreCtx;

  /**@return {RootStore}*/
  get rootStore() {
    return this.context;
  }

  componentDidMount() {
    this.rootStore.init();

    if (this.rootStore.isPopup) {
      document.body.classList.add('popup');
    }

    // Apply theme
    const applyTheme = (theme) => {
      if (!theme || theme === 'system') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    };

    this.disposeThemeReaction = reaction(
      () => this.rootStore.config?.theme,
      (theme) => applyTheme(theme),
      {fireImmediately: true}
    );
  }

  componentWillUnmount() {
    if (this.disposeThemeReaction) {
      this.disposeThemeReaction();
    }
  }

  render() {
    if (this.rootStore.state === 'pending') {
      return (
        <div className="loading"/>
      );
    }

    if (this.rootStore.state !== 'done') {
      return `Loading: ${this.rootStore.state}`;
    }

    return (
      <div className="container">
        <div className="search_panel">
          <h1>{chrome.i18n.getMessage('appName')}</h1>
        </div>
        <HashRouter>
          <div className="content">
            <div className="left menu">
              <NavLink to="/" className={({isActive}) => isActive ? 'active' : ''} end>{chrome.i18n.getMessage('optClient')}</NavLink>
              <NavLink to="/main" className={({isActive}) => isActive ? 'active' : ''}>{chrome.i18n.getMessage('optMain')}</NavLink>
              <NavLink to="/notify" className={({isActive}) => isActive ? 'active' : ''}>{chrome.i18n.getMessage('optNotify')}</NavLink>
              <NavLink to="/ctx" className={({isActive}) => isActive ? 'active' : ''}>{chrome.i18n.getMessage('optCtx')}</NavLink>
              <NavLink to="/backup" className={({isActive}) => isActive ? 'active' : ''}>{chrome.i18n.getMessage('backupRestore')}</NavLink>
            </div>
            <div className="right">
              <Routes>
                <Route path="/" element={<ClientOptions/>}/>
                <Route path="/main" element={<UiOptions/>}/>
                <Route path="/notify" element={<NotifyOptions/>}/>
                <Route path="/ctx" element={<CtxOptions/>}/>
                <Route path="/backup" element={<BackupRestoreOptions/>}/>
                <Route path="*" element={<Navigate to="/"/>}/>
              </Routes>
            </div>
          </div>
        </HashRouter>
        <footer className="bottom">
          <a href="https://github.com/mthcore/transmission_extension" target="_blank" rel="noopener noreferrer">GitHub</a>
        </footer>
      </div>
    );
  }
}

const ClientOptions = observer((props) => {
  const location = useLocation();
  return <ClientOptionsInner {...props} location={location}/>;
});

@observer
class ClientOptionsInner extends React.PureComponent {
  static propTypes = {
    location: PropTypes.object,
  };

  static contextType = RootStoreCtx;

  state = {
    clientStatus: null, // pending, done, error
    clientStatusText: '',
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.context;
  }

  /**@return {ConfigStore}*/
  get configStore() {
    return this.rootStore.config;
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const login = form.elements.login.value;
    const password = form.elements.password.value;
    const hostname = form.elements.hostname.value.trim();
    const port = parseInt(form.elements.port.value, 10);
    const ssl = form.elements.ssl.checked;
    const pathname = form.elements.pathname.value.trim();
    const webPathname = form.elements.webPathname.value.trim();
    const authenticationRequired = form.elements.authenticationRequired.checked;

    this.setState({
      clientStatus: 'pending'
    });
    return Promise.resolve().then(() => {
      if (!Number.isFinite(port)) {
        throw new Error(chrome.i18n.getMessage('portIncorrect'));
      }
      return this.rootStore.config.setOptions({
        login, password, hostname, port, ssl, pathname, webPathname, authenticationRequired
      });
    }).then((() => {
      if (!this.refPage.current) return;
      return this.rootStore.client.updateSettings();
    })).then(() => {
      if (!this.refPage.current) return;
      this.setState({
        clientStatus: 'done'
      });

      if (this.props.location.hash === '#redirect') {
        location.href = '/index.html'
      } else
      if (this.props.location.hash === '#redirectPopup') {
        location.href = '/index.html#popup'
      }
    }, (err) => {
      if (!this.refPage.current) return;
      this.setState({
        clientStatus: 'error',
        clientStatusText: `${err.name}: ${err.message}`
      });
    });
  };

  refPage = React.createRef();

  render() {
    let status = null;
    if (this.state.clientStatus) {
      switch (this.state.clientStatus) {
        case 'pending': {
          status = (
            <div>
              <div className="loading-inline"/>
            </div>
          );
          break;
        }
        case 'done': {
          status = (
            <div>
              <span className="green">{chrome.i18n.getMessage('DLG_BTN_OK')}</span>
            </div>
          );
          break;
        }
        case 'error': {
          status = (
            <div>
              <span className="red">{this.state.clientStatusText}</span>
            </div>
          );
          break;
        }
      }
    }

    return (
      <div ref={this.refPage} className="page client">
        <form onSubmit={this.handleSubmit} autoComplete="off">
          <h2>{chrome.i18n.getMessage('optClient')}</h2>
          <label>
            <span>{chrome.i18n.getMessage('DLG_SETTINGS_4_CONN_16')}</span>
            <input name="login" type="text" defaultValue={this.configStore.login}/>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('DLG_SETTINGS_4_CONN_18')}</span>
            <input name="password" type="password" defaultValue={this.configStore.password}/>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('PRS_COL_IP')}</span>
            <input name="hostname" type="text" defaultValue={this.configStore.hostname} placeholder="127.0.0.1" required={true}/>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('PRS_COL_PORT')}</span>
            <input name="port" type="number" defaultValue={this.configStore.port} required={true}/>
          </label>
          <h3>{chrome.i18n.getMessage('ST_CAPT_ADVANCED')}</h3>
          <label>
            <span>{chrome.i18n.getMessage('requireAuthentication')}</span>
            <span className="toggle-switch">
              <input type="checkbox" name="authenticationRequired" defaultChecked={this.configStore.authenticationRequired}/>
              <span className="toggle-slider"></span>
            </span>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('guiPath')}</span>
            <input type="text" name="webPathname" defaultValue={this.configStore.webPathname}/>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('useSSL')}</span>
            <span className="toggle-switch">
              <input type="checkbox" name="ssl" defaultChecked={this.configStore.ssl}/>
              <span className="toggle-slider"></span>
            </span>
          </label>
          <label>
            <span>{chrome.i18n.getMessage('path')}</span>
            <input type="text" name="pathname" defaultValue={this.configStore.pathname}/>
          </label>
          <div id="checkContainer">
            <div>
              <button type="submit">{chrome.i18n.getMessage('DLG_BTN_APPLY')}</button>
            </div>
            {status}
          </div>
        </form>
      </div>
    );
  }
}

class OptionsPage extends React.Component {
  static contextType = RootStoreCtx;

  /**@return {RootStore}*/
  get rootStore() {
    return this.context;
  }

  /**@return {ConfigStore}*/
  get configStore() {
    return this.rootStore.config;
  }

  handleChange = (e) => {
    const checkbox = e.currentTarget;
    this.configStore.setOptions({
      [checkbox.name]: checkbox.checked
    });
  };

  handleSetInt = (e) => {
    const input = e.currentTarget;
    const value = parseInt(input.value, 10);
    if (Number.isFinite(value)) {
      this.configStore.setOptions({
        [input.name]: value
      });
    }
  };

  handleRadioChange = (e) => {
    const radio = e.currentTarget;
    this.configStore.setOptions({
      [radio.name]: radio.value
    });
  };
}

@observer
class UiOptions extends OptionsPage {
  handleThemeChange = (e) => {
    this.configStore.setTheme(e.target.value);
  };

  render() {
    return (
      <div className="page main">
        <h2>{chrome.i18n.getMessage('optMain')}</h2>
        <label>
          <span>{chrome.i18n.getMessage('theme')}</span>
          <select value={this.configStore.theme} onChange={this.handleThemeChange}>
            <option value="system">{chrome.i18n.getMessage('themeSystem')}</option>
            <option value="light">{chrome.i18n.getMessage('themeLight')}</option>
            <option value="dark">{chrome.i18n.getMessage('themeDark')}</option>
          </select>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('showFreeSpace')}</span>
          <span className="toggle-switch">
            <input onChange={this.handleChange} name="showFreeSpace" type="checkbox" defaultChecked={this.configStore.showFreeSpace}/>
            <span className="toggle-slider"></span>
          </span>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('hideSeedStatusItem')}</span>
          <span className="toggle-switch">
            <input onChange={this.handleChange} name="hideSeedingTorrents" type="checkbox" defaultChecked={this.configStore.hideSeedingTorrents}/>
            <span className="toggle-slider"></span>
          </span>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('hideFinishStatusItem')}</span>
          <span className="toggle-switch">
            <input onChange={this.handleChange} name="hideFinishedTorrents" type="checkbox" defaultChecked={this.configStore.hideFinishedTorrents}/>
            <span className="toggle-slider"></span>
          </span>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('showSpeedGraph')}</span>
          <span className="toggle-switch">
            <input onChange={this.handleChange} name="showSpeedGraph" type="checkbox" defaultChecked={this.configStore.showSpeedGraph}/>
            <span className="toggle-slider"></span>
          </span>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('popupUpdateInterval')}</span>
          <input onChange={this.handleSetInt} name="uiUpdateInterval" type="number" min="100" defaultValue={this.configStore.uiUpdateInterval}/>
          {' '}
          <span>{chrome.i18n.getMessage('ms')}</span>
        </label>
      </div>
    );
  }
}

@observer
class NotifyOptions extends OptionsPage {
  state = {
    colorPickerOpened: false
  };

  handleToggleColorPicker = (e) => {
    e.preventDefault();
    this.setState({
      colorPickerOpened: !this.state.colorPickerOpened
    });
  };

  handleChangeColor = (color) => {
    const rgba = [color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a].join(',');
    this.configStore.setOptions({
      badgeColor: rgba
    });
  };

  render() {
    const [r,g,b,a] = this.configStore.badgeColor.split(',');
    const sketchPickerColor = {
      r: parseInt(r, 10),
      g: parseInt(g, 10),
      b: parseInt(b, 10),
      a: parseFloat(a),
    };

    return (
      <div className="page notify">
        <h2>{chrome.i18n.getMessage('optNotify')}</h2>
        <label>
          <span>{chrome.i18n.getMessage('showNotificationOnDownloadComplete')}</span>
          <span className="toggle-switch">
            <input defaultChecked={this.configStore.showDownloadCompleteNotifications} onChange={this.handleChange} type="checkbox" name="showDownloadCompleteNotifications"/>
            <span className="toggle-slider"></span>
          </span>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('displayActiveTorrentCountIcon')}</span>
          <span className="toggle-switch">
            <input defaultChecked={this.configStore.showActiveCountBadge} onChange={this.handleChange} type="checkbox" name="showActiveCountBadge"/>
            <span className="toggle-slider"></span>
          </span>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('badgeColor')}</span>
          <Popover
            isOpen={this.state.colorPickerOpened}
            onClickOutside={this.handleToggleColorPicker}
            position={'bottom'}
            content={(
              <SketchPicker color={sketchPickerColor} onChangeComplete={this.handleChangeColor}/>
            )}
          >
            <span onClick={this.handleToggleColorPicker} className="selectColor" style={{backgroundColor: `rgba(${this.configStore.badgeColor})`}}/>
          </Popover>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('backgroundUpdateInterval')}</span>
          <input defaultValue={this.configStore.backgroundUpdateInterval} onChange={this.handleSetInt} type="number" name="backgroundUpdateInterval" min="1000"/>
          {' '}
          <span>{chrome.i18n.getMessage('ms')}</span>
        </label>
      </div>
    );
  }
}

@observer
class CtxOptions extends OptionsPage {
  render() {
    return (
      <div className="page ctx">
        <h2>{chrome.i18n.getMessage('optCtx')}</h2>
        <CtxOptionsDirs configStore={this.configStore} handleChange={this.handleChange}/>
      </div>
    );
  }
}

@observer
class CtxOptionsDirs extends OptionsPage {
  handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const path = form.elements.path.value.trim();
    const name = form.elements.name.value.trim();
    if (!path) return;

    if (!this.configStore.hasFolder(path)) {
      this.configStore.addFolder(path, name);
      form.elements.path.value = '';
      form.elements.name.value = '';
    }
  };

  bodyRef = React.createRef();
  refDirectorySelect = React.createRef();

  get selectedDirectories() {
    return Array.from(this.refDirectorySelect.current.selectedOptions).map((option) => {
      return this.configStore.folders[parseInt(option.value, 10)];
    });
  }

  handleRemove = (e) => {
    e.preventDefault();
    this.configStore.removeFolders(this.selectedDirectories);
  };

  handleMoveUp = (e) => {
    e.preventDefault();
    this.configStore.moveFolders(this.selectedDirectories, -1);
  };

  handleMoveDown = (e) => {
    e.preventDefault();
    this.configStore.moveFolders(this.selectedDirectories, 1);
  };

  render() {
    const directories = this.configStore.folders.map((folder, index) => {
      let name = folder.path;
      if (folder.name) {
        name = `${folder.name} (${name})`;
      }
      return (
        <option key={JSON.stringify(folder)} value={index}>{name}</option>
      );
    });

    return (
      <div ref={this.bodyRef} className="dir-manager">
        <h3>{chrome.i18n.getMessage('dirList')}</h3>
        <p className="section-hint">{chrome.i18n.getMessage('dirListHint')}</p>
        <form onSubmit={this.handleSubmit} autoComplete="off" className="dir-form">
          <div className="dir-form-row">
            <input name="path" type="text" required={true} placeholder={chrome.i18n.getMessage('subPath')}/>
            <input name="name" type="text" placeholder={chrome.i18n.getMessage('shortName')}/>
            <button type="submit">{chrome.i18n.getMessage('add')}</button>
          </div>
        </form>
        <div className="dir-list-container">
          <select ref={this.refDirectorySelect} id="folderList" multiple>
            {directories}
          </select>
          <div className="dir-list-actions">
            <button type="button" onClick={this.handleMoveUp} title={chrome.i18n.getMessage('up')}>▲</button>
            <button type="button" onClick={this.handleMoveDown} title={chrome.i18n.getMessage('down')}>▼</button>
            <button type="button" onClick={this.handleRemove} title={chrome.i18n.getMessage('deleteSelected')}>✕</button>
          </div>
        </div>
        <h3>{chrome.i18n.getMessage('options')}</h3>
        <label>
          <span>{chrome.i18n.getMessage('treeViewContextMenu')}</span>
          <span className="toggle-switch">
            <input onChange={this.handleChange} defaultChecked={this.configStore.treeViewContextMenu} type="checkbox" name="treeViewContextMenu"/>
            <span className="toggle-slider"></span>
          </span>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('showDefaultFolderContextMenuItem')}</span>
          <span className="toggle-switch">
            <input onChange={this.handleChange} defaultChecked={this.configStore.putDefaultPathInContextMenu} type="checkbox" name="putDefaultPathInContextMenu"/>
            <span className="toggle-slider"></span>
          </span>
        </label>
        <label>
          <span>{chrome.i18n.getMessage('selectDownloadCategoryOnAddItemFromContextMenu')}</span>
          <span className="toggle-switch">
            <input onChange={this.handleChange} defaultChecked={this.configStore.selectDownloadCategoryAfterPutTorrentFromContextMenu} type="checkbox" name="selectDownloadCategoryAfterPutTorrentFromContextMenu"/>
            <span className="toggle-slider"></span>
          </span>
        </label>
      </div>
    );
  }
}

class BackupRestoreOptions extends React.PureComponent {
  state = {
    loadState: 'idle', // idle, pending, done, error
    saveState: 'idle', // idle, pending, done, error
    restoreState: 'idle', // idle, pending, done, error
    hasCloudData: false,
    storage: null
  };

  componentDidMount() {
    this.handleLoadConfig();
    this.checkCloudData();
  }

  checkCloudData() {
    storageGet({backup: ''}, 'sync').then((storage) => {
      if (!this.refPage.current) return;
      this.setState({hasCloudData: !!storage.backup});
    }, (err) => {
      logger.error('checkCloudData error', err);
    });
  }

  handleLoadConfig = (e) => {
    e && e.preventDefault();
    this.setState({loadState: 'pending'});
    storageGet().then((storage) => {
      if (!this.refPage.current) return;
      this.setState({
        loadState: 'done',
        storage: JSON.stringify(storage, null, 2)
      });
    }, (err) => {
      if (!this.refPage.current) return;
      this.setState({loadState: 'error', storage: ''});
    });
  };

  handleSaveToCloud = (e) => {
    e.preventDefault();
    this.setState({saveState: 'pending'});
    storageSet({backup: this.refData.current.value}, 'sync').then(() => {
      if (!this.refPage.current) return;
      this.setState({saveState: 'done', hasCloudData: true});
      setTimeout(() => {
        if (!this.refPage.current) return;
        this.setState({saveState: 'idle'});
      }, 2000);
    }, (err) => {
      logger.error('handleSaveToCloud error', err);
      if (!this.refPage.current) return;
      this.setState({saveState: 'error'});
    });
  };

  handleLoadFromCloud = (e) => {
    e.preventDefault();
    storageGet({backup: ''}, 'sync').then((storage) => {
      if (!this.refPage.current) return;
      if (storage.backup) {
        this.refData.current.value = storage.backup;
      }
    }, (err) => {
      logger.error('handleLoadFromCloud error', err);
    });
  };

  handleClearCloud = (e) => {
    e.preventDefault();
    storageRemove(['backup'], 'sync').then(() => {
      if (!this.refPage.current) return;
      this.setState({hasCloudData: false});
    }, (err) => {
      logger.error('handleClearCloud error', err);
    });
  };

  handleRestore = (e) => {
    e.preventDefault();
    this.setState({restoreState: 'pending'});
    Promise.resolve().then(() => {
      const config = Object.assign({configVersion: 1}, JSON.parse(this.refData.current.value));
      if (config.configVersion !== 2) {
        config.configVersion = 2;
        migrateConfig(config, config);
      }
      return storageSet(config);
    }).then(() => {
      if (!this.refPage.current) return;
      this.setState({restoreState: 'done'});
      setTimeout(() => {
        if (!this.refPage.current) return;
        this.setState({restoreState: 'idle'});
      }, 2000);
    }).catch((err) => {
      logger.error('handleRestore error', err);
      if (!this.refPage.current) return;
      this.setState({restoreState: 'error'});
    });
  };

  refPage = React.createRef();
  refData = React.createRef();

  render() {
    const {loadState, saveState, restoreState, hasCloudData, storage} = this.state;

    return (
      <div ref={this.refPage} className="page backup-restore">
        <h2>{chrome.i18n.getMessage('backupRestore')}</h2>

        <div className="backup-section">
          <h3>{chrome.i18n.getMessage('backup')}</h3>
          <p className="section-hint">{chrome.i18n.getMessage('backupHint')}</p>
          <div className="backup-actions">
            <button type="button" onClick={this.handleLoadConfig} disabled={loadState === 'pending'}>
              {loadState === 'pending' ? '...' : chrome.i18n.getMessage('loadCurrentConfig')}
            </button>
            <button type="button" onClick={this.handleSaveToCloud} disabled={loadState !== 'done' || saveState === 'pending'}>
              {saveState === 'pending' ? '...' : saveState === 'done' ? '✓' : chrome.i18n.getMessage('optSaveInCloud')}
            </button>
          </div>
        </div>

        <div className="backup-section">
          <h3>{chrome.i18n.getMessage('configData')}</h3>
          {loadState === 'done' ? (
            <textarea ref={this.refData} defaultValue={storage}/>
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
            <button type="button" onClick={this.handleRestore} disabled={loadState !== 'done' || restoreState === 'pending'}>
              {restoreState === 'pending' ? '...' : restoreState === 'done' ? '✓' : chrome.i18n.getMessage('toRestore')}
            </button>
            <button type="button" onClick={this.handleLoadFromCloud} disabled={!hasCloudData}>
              {chrome.i18n.getMessage('optGetFromCloud')}
            </button>
            <button type="button" onClick={this.handleClearCloud} disabled={!hasCloudData}>
              {chrome.i18n.getMessage('optClearCloudStorage')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const rootStore = window.rootStore = RootStore.create();

createRoot(document.getElementById('root')).render(
  <RootStoreCtx.Provider value={rootStore}>
    <Options/>
  </RootStoreCtx.Provider>
);