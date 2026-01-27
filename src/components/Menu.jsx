import React, {useContext, useCallback, useState, useRef, useEffect} from "react";
import {observer} from "mobx-react";
import ComponentLoader from "./ComponentLoader";
import showError from "../tools/showError";
import VisiblePage from "./VisiblePage";
import RootStoreCtx from "../tools/RootStoreCtx";
import SearchBox from "./SearchBox";
import LabelSelect from "./LabelSelect";

const Menu = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const [showDropLayer, setShowDropLayer] = useState(false);
  const [isDropped, setIsDropped] = useState(false);
  const refFileInput = useRef(null);
  const dropTimerRef = useRef(null);

  const onPutFiles = useCallback((files) => {
    if (!files.length) return;

    const dialog = rootStore.createDialog({
      type: 'putFiles'
    });

    dialog.files = Array.from(files);
    dialog.setReady(true);
  }, [rootStore]);

  const handleDropOver = useCallback((e) => {
    if (e.dataTransfer.types.length === 2) return;
    e.preventDefault();

    setShowDropLayer(true);

    clearTimeout(dropTimerRef.current);
    dropTimerRef.current = setTimeout(() => {
      if (!refFileInput.current) return;
      setShowDropLayer(false);
      setIsDropped(false);
    }, 300);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDropped(true);
    onPutFiles(e.dataTransfer.files);
  }, [onPutFiles]);

  useEffect(() => {
    document.body.addEventListener('dragover', handleDropOver);
    document.body.addEventListener('drop', handleDrop);

    return () => {
      document.body.removeEventListener('dragover', handleDropOver);
      document.body.removeEventListener('drop', handleDrop);
      clearTimeout(dropTimerRef.current);
    };
  }, [handleDropOver, handleDrop]);

  const handleRefresh = useCallback((e) => {
    e.preventDefault();
    rootStore.client.updateTorrentList(true).catch((err) => {
      showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to refresh', err);
    });
    rootStore.client.updateSettings().catch((err) => {
      showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to update settings', err);
    });
  }, [rootStore]);

  const handleAddFile = useCallback((e) => {
    e.preventDefault();
    refFileInput.current.dispatchEvent(new MouseEvent('click'));
  }, []);

  const handleAddUrl = useCallback((e) => {
    e.preventDefault();
    rootStore.createDialog({
      type: 'putUrl'
    });
  }, [rootStore]);

  const handleStartAll = useCallback((e) => {
    e.preventDefault();
    const ids = rootStore.client.torrentIds;
    rootStore.client.torrentsStart(ids);
  }, [rootStore]);

  const handleStopAll = useCallback((e) => {
    e.preventDefault();
    const ids = rootStore.client.torrentIds;
    rootStore.client.torrentsStop(ids);
  }, [rootStore]);

  const handleToggleAltSpeed = useCallback((e) => {
    e.preventDefault();
    rootStore.client.setAltSpeedEnabled(!rootStore.client.settings.altSpeedEnabled);
  }, [rootStore]);

  const handleFileChange = useCallback((e) => {
    onPutFiles(refFileInput.current.files);
    e.currentTarget.value = '';
  }, [onPutFiles]);

  let dropLayer = null;
  if (showDropLayer) {
    const classList = ['drop_layer'];
    if (isDropped) {
      classList.push('dropped');
    }
    dropLayer = (
      <div className={classList.join(' ')}/>
    );
  }

  let graph = null;
  if (rootStore.config.showSpeedGraph && rootStore.client) {
    graph = (
      <VisiblePage>
        <ComponentLoader load-page={'graph'}/>
      </VisiblePage>
    );
  }

  const altSpeedClassList = ['btn alt_speed'];
  if (rootStore.client && rootStore.client.settings) {
    if (rootStore.client.settings.altSpeedEnabled) {
      altSpeedClassList.push('active');
    }
  }

  return (
    <>
      <ul className="menu">
        <li>
          <a onClick={handleRefresh} title={chrome.i18n.getMessage('refresh')} className="btn refresh"
             aria-label={chrome.i18n.getMessage('refresh')} href="#refresh"/>
        </li>
        <li>
          <a href={rootStore.config.webUiUrl} target="_blank" title={chrome.i18n.getMessage('ST_CAPT_WEBUI')}
             aria-label={chrome.i18n.getMessage('ST_CAPT_WEBUI')} className="btn wui"/>
        </li>
        <li className="separate"/>
        <li>
          <a onClick={handleAddFile} title={chrome.i18n.getMessage('Open_file')} className="btn add_file"
             aria-label={chrome.i18n.getMessage('Open_file')} href="#add_file"/>
          <input ref={refFileInput} onChange={handleFileChange} type="file"
                 accept="application/x-bittorrent" multiple={true} style={{display: 'none'}}/>
        </li>
        <li>
          <a onClick={handleAddUrl} title={chrome.i18n.getMessage('MM_FILE_ADD_URL')}
             aria-label={chrome.i18n.getMessage('MM_FILE_ADD_URL')} className="btn add_magnet" href="#add_magnet"/>
        </li>
        <li className="separate"/>
        <li>
          <a onClick={handleToggleAltSpeed} title={chrome.i18n.getMessage('altSpeedEnable')}
             aria-label={chrome.i18n.getMessage('altSpeedEnable')} className={altSpeedClassList.join(' ')} href="#alt_speed"/>
        </li>
        <li className="separate"/>
        <li>
          <a onClick={handleStartAll} title={chrome.i18n.getMessage('STM_TORRENTS_RESUMEALL')}
             aria-label={chrome.i18n.getMessage('STM_TORRENTS_RESUMEALL')} className="btn start_all" href="#start_all"/>
        </li>
        <li>
          <a onClick={handleStopAll} title={chrome.i18n.getMessage('STM_TORRENTS_PAUSEALL')}
             aria-label={chrome.i18n.getMessage('STM_TORRENTS_PAUSEALL')} className="btn pause_all" href="#stop_all"/>
        </li>
        <li className="graph">
          {graph}
        </li>
        <SearchBox/>
        <LabelSelect/>
      </ul>

      {dropLayer}
    </>
  );
});

export default Menu;
