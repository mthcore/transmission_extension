import { observer } from "mobx-react";
import React, { useContext, useEffect, useCallback, MouseEvent } from "react";
import Interval from "./Interval";
import RootStoreCtx from "../tools/rootStoreCtx";
import { SPACE_WATCHER_INTERVAL } from "../constants";

const SpaceWatcher = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const spaceWatcherStore = rootStore?.spaceWatcher;

  useEffect(() => {
    rootStore?.createSpaceWatcher();
    return () => rootStore?.destroySpaceWatcher();
  }, [rootStore]);

  const onIntervalFire = useCallback(() => {
    spaceWatcherStore?.fetchDownloadDirs();
  }, [spaceWatcherStore]);

  const handleUpdate = useCallback((e: MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    onIntervalFire();
  }, [onIntervalFire]);

  if (!spaceWatcherStore) return null;

  let title: string | null = null;
  let body: React.ReactNode = null;

  if (spaceWatcherStore.state === 'pending') {
    title = 'Loading...';
    body = '...';
  } else if (spaceWatcherStore.state === 'error') {
    title = spaceWatcherStore.errorMessage;
    body = '-';
  } else if (spaceWatcherStore.state === 'done') {
    const status = [`${chrome.i18n.getMessage('freeSpace')}:`];
    body = spaceWatcherStore.downloadDirs.map((directory) => {
      status.push(`${directory.availableStr} (${directory.path})`);
      return (
        <span key={directory.path}>{directory.availableStr} </span>
      );
    });
    title = status.join('\n');
  }

  return (
    <>
      <span className="space disk" onClick={handleUpdate} title={title || undefined}>{body}</span>
      <Interval interval={SPACE_WATCHER_INTERVAL} onFire={onIntervalFire}/>
    </>
  );
});

export default SpaceWatcher;
