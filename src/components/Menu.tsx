import React, { useContext, useCallback, useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import { observer } from "mobx-react";
import ComponentLoader from "./ComponentLoader";
import showError from "../tools/showError";
import VisiblePage from "./VisiblePage";
import RootStoreCtx from "../tools/rootStoreCtx";
import SearchBox from "./SearchBox";
import LabelSelect from "./LabelSelect";

const Menu: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const [showDropLayer, setShowDropLayer] = useState(false);
  const [isDropped, setIsDropped] = useState(false);
  const refFileInput = useRef<HTMLInputElement>(null);
  const dropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const client = rootStore?.client;
  const config = rootStore?.config;

  const onPutFiles = useCallback((files: FileList) => {
    if (!files.length || !rootStore) return;

    const dialog = rootStore.createDialog({
      type: 'putFiles'
    });

    (dialog as unknown as { files: File[]; setReady: (ready: boolean) => void }).files = Array.from(files);
    (dialog as unknown as { setReady: (ready: boolean) => void }).setReady(true);
  }, [rootStore]);

  const handleDropOver = useCallback((e: DragEvent<HTMLBodyElement> | globalThis.DragEvent) => {
    if (e.dataTransfer?.types.length === 2) return;
    e.preventDefault();

    setShowDropLayer(true);

    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
    }
    dropTimerRef.current = setTimeout(() => {
      if (!refFileInput.current) return;
      setShowDropLayer(false);
      setIsDropped(false);
    }, 300);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLBodyElement> | globalThis.DragEvent) => {
    e.preventDefault();
    setIsDropped(true);
    if (e.dataTransfer?.files) {
      onPutFiles(e.dataTransfer.files);
    }
  }, [onPutFiles]);

  useEffect(() => {
    const dropOverHandler = (e: globalThis.DragEvent) => handleDropOver(e);
    const dropHandler = (e: globalThis.DragEvent) => handleDrop(e);

    document.body.addEventListener('dragover', dropOverHandler);
    document.body.addEventListener('drop', dropHandler);

    return () => {
      document.body.removeEventListener('dragover', dropOverHandler);
      document.body.removeEventListener('drop', dropHandler);
      if (dropTimerRef.current) {
        clearTimeout(dropTimerRef.current);
      }
    };
  }, [handleDropOver, handleDrop]);

  const handleRefresh = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    client?.updateTorrentList(true).catch((err) => {
      showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to refresh', err);
    });
    client?.updateSettings().catch((err) => {
      showError(chrome.i18n.getMessage('OV_FL_ERROR') || 'Failed to update settings', err);
    });
  }, [client]);

  const handleAddFile = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    refFileInput.current?.dispatchEvent(new MouseEvent('click'));
  }, []);

  const handleAddUrl = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    rootStore?.createDialog({
      type: 'putUrl'
    });
  }, [rootStore]);

  const handleStartAll = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const ids = client?.torrentIds;
    if (ids && client) {
      client.torrentsStart(ids);
    }
  }, [client]);

  const handleStopAll = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const ids = client?.torrentIds;
    if (ids && client) {
      client.torrentsStop(ids);
    }
  }, [client]);

  const handleToggleAltSpeed = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (client?.settings) {
      client.setAltSpeedEnabled(!client.settings.altSpeedEnabled);
    }
  }, [client]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (refFileInput.current?.files) {
      onPutFiles(refFileInput.current.files);
    }
    e.currentTarget.value = '';
  }, [onPutFiles]);

  if (!rootStore || !config) return null;

  let dropLayer: React.ReactNode = null;
  if (showDropLayer) {
    const classList = ['drop_layer'];
    if (isDropped) {
      classList.push('dropped');
    }
    dropLayer = (
      <div className={classList.join(' ')}/>
    );
  }

  let graph: React.ReactNode = null;
  if (config.showSpeedGraph && client) {
    graph = (
      <VisiblePage>
        <ComponentLoader load-page={'graph'}/>
      </VisiblePage>
    );
  }

  const altSpeedClassList = ['btn alt_speed'];
  if (client && client.settings) {
    if (client.settings.altSpeedEnabled) {
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
          <a href={config.webUiUrl} target="_blank" title={chrome.i18n.getMessage('ST_CAPT_WEBUI')}
             aria-label={chrome.i18n.getMessage('ST_CAPT_WEBUI')} className="btn wui"/>
        </li>
        <li className="separate"/>
        <li>
          <a onClick={handleAddFile} title={chrome.i18n.getMessage('Open_file')} className="btn add_file"
             aria-label={chrome.i18n.getMessage('Open_file')} href="#add_file"/>
          <input ref={refFileInput} onChange={handleFileChange} type="file"
                 accept="application/x-bittorrent" multiple={true} style={{ display: 'none' }}/>
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
