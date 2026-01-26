import React from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {observer} from "mobx-react";
import RootStoreCtx from "../tools/RootStoreCtx";

const TorrentContextMenu = observer(({children, torrentId}) => {
  const rootStore = React.useContext(RootStoreCtx);
  const torrentListStore = rootStore.torrentList;

  const handleOpenChange = (open) => {
    if (open && !torrentListStore.selectedIds.includes(torrentId)) {
      // Right-click on unselected item: select only this one
      torrentListStore.resetSelectedIds();
      torrentListStore.addSelectedId(torrentId);
    }
    // If already selected: keep current selection for bulk actions
  };

  return (
    <ContextMenu.Root onOpenChange={handleOpenChange}>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <TorrentMenuContent />
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
});

const TorrentMenuContent = observer(() => {
  const rootStore = React.useContext(RootStoreCtx);
  const torrentListStore = rootStore.torrentList;
  const selectedIds = torrentListStore.selectedIds;

  if (!selectedIds.length) return null;

  const firstTorrent = selectedIds.length > 0
    ? rootStore.client.torrents.get(selectedIds[0])
    : null;

  // Collect available actions from selected torrents
  const actions = ['_', 'remove', 'remove_with', 'extra', 'order', 'torrent_files'];
  selectedIds.forEach((id) => {
    const torrent = rootStore.client.torrents.get(id);
    if (torrent) {
      torrent.actions.forEach((action) => {
        if (!actions.includes(action)) {
          actions.push(action);
        }
      });
    }
  });

  const handleStart = () => {
    rootStore.client.torrentsStart(selectedIds);
  };

  const handleForceStart = () => {
    rootStore.client.torrentsForceStart(selectedIds);
  };

  const handleStop = () => {
    rootStore.client.torrentsStop(selectedIds);
  };

  const handleRecheck = () => {
    rootStore.client.torrentsRecheck(selectedIds);
  };

  const handleRemove = () => {
    rootStore.createDialog({
      type: 'removeConfirm',
      torrentIds: selectedIds.slice(0)
    });
  };

  const handleRemoveTorrent = () => {
    rootStore.client.torrentsRemoveTorrent(selectedIds);
  };

  const handleRemoveTorrentFiles = () => {
    rootStore.client.torrentsRemoveTorrentFiles(selectedIds);
  };

  const handleRename = () => {
    if (!firstTorrent) return;
    rootStore.createDialog({
      type: 'rename',
      path: firstTorrent.name,
      torrentIds: selectedIds.slice(0)
    });
  };

  const handleCopyMagnetUrl = () => {
    if (!firstTorrent) return;
    rootStore.createDialog({
      type: 'copyMagnetUrl',
      magnetLink: firstTorrent.magnetLink,
      torrentIds: selectedIds.slice(0)
    });
  };

  const handleMove = () => {
    if (!firstTorrent) return;
    rootStore.createDialog({
      type: 'move',
      directory: firstTorrent.directory,
      torrentIds: selectedIds.slice(0)
    });
  };

  const handleReannounce = () => {
    rootStore.client.reannounce(selectedIds);
  };

  const handleQueueTop = () => {
    rootStore.client.torrentsQueueTop(selectedIds);
  };

  const handleQueueUp = () => {
    rootStore.client.torrentsQueueUp(selectedIds);
  };

  const handleQueueDown = () => {
    rootStore.client.torrentsQueueDown(selectedIds);
  };

  const handleQueueBottom = () => {
    rootStore.client.torrentsQueueBottom(selectedIds);
  };

  const handleShowFiles = () => {
    if (selectedIds.length) {
      rootStore.createFileList(selectedIds[0]);
    }
  };

  const handleShowProperties = () => {
    if (selectedIds.length) {
      rootStore.createDialog({
        type: 'torrentDetails',
        torrentId: selectedIds[0]
      });
    }
  };

  return (
    <ContextMenu.Content className="context-menu">
      {actions.includes('start') && (
        <ContextMenu.Item className="context-menu-item" onSelect={handleStart}>
          {chrome.i18n.getMessage('ML_START')}
        </ContextMenu.Item>
      )}
      {actions.includes('forcestart') && (
        <ContextMenu.Item className="context-menu-item" onSelect={handleForceStart}>
          {chrome.i18n.getMessage('startNow')}
        </ContextMenu.Item>
      )}
      {actions.includes('stop') && (
        <ContextMenu.Item className="context-menu-item" onSelect={handleStop}>
          {chrome.i18n.getMessage('ML_STOP')}
        </ContextMenu.Item>
      )}

      <ContextMenu.Separator className="context-menu-separator" />

      {actions.includes('recheck') && (
        <ContextMenu.Item className="context-menu-item" onSelect={handleRecheck}>
          {chrome.i18n.getMessage('ML_FORCE_RECHECK')}
        </ContextMenu.Item>
      )}

      <ContextMenu.Item className="context-menu-item" onSelect={handleRemove}>
        {chrome.i18n.getMessage('ML_REMOVE')}
      </ContextMenu.Item>

      <ContextMenu.Sub>
        <ContextMenu.SubTrigger className="context-menu-item context-menu-subtrigger">
          {chrome.i18n.getMessage('ML_REMOVE_AND')}
          <span className="context-menu-arrow">&#9656;</span>
        </ContextMenu.SubTrigger>
        <ContextMenu.Portal>
          <ContextMenu.SubContent className="context-menu">
            <ContextMenu.Item className="context-menu-item" onSelect={handleRemoveTorrent}>
              {chrome.i18n.getMessage('ML_DELETE_TORRENT')}
            </ContextMenu.Item>
            <ContextMenu.Item className="context-menu-item" onSelect={handleRemoveTorrentFiles}>
              {chrome.i18n.getMessage('ML_DELETE_DATATORRENT')}
            </ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Portal>
      </ContextMenu.Sub>

      <ContextMenu.Separator className="context-menu-separator" />

      <ContextMenu.Sub>
        <ContextMenu.SubTrigger className="context-menu-item context-menu-subtrigger">
          {chrome.i18n.getMessage('extra')}
          <span className="context-menu-arrow">&#9656;</span>
        </ContextMenu.SubTrigger>
        <ContextMenu.Portal>
          <ContextMenu.SubContent className="context-menu">
            {selectedIds.length === 1 && (
              <>
                <ContextMenu.Item className="context-menu-item" onSelect={handleRename}>
                  {chrome.i18n.getMessage('rename')}
                </ContextMenu.Item>
                <ContextMenu.Item className="context-menu-item" onSelect={handleCopyMagnetUrl}>
                  {chrome.i18n.getMessage('magnetUri')}
                </ContextMenu.Item>
              </>
            )}
            <ContextMenu.Item className="context-menu-item" onSelect={handleMove}>
              {chrome.i18n.getMessage('move')}
            </ContextMenu.Item>
            <ContextMenu.Item className="context-menu-item" onSelect={handleReannounce}>
              {chrome.i18n.getMessage('reannounce')}
            </ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Portal>
      </ContextMenu.Sub>

      <ContextMenu.Sub>
        <ContextMenu.SubTrigger className="context-menu-item context-menu-subtrigger">
          {chrome.i18n.getMessage('OV_COL_ORDER')}
          <span className="context-menu-arrow">&#9656;</span>
        </ContextMenu.SubTrigger>
        <ContextMenu.Portal>
          <ContextMenu.SubContent className="context-menu">
            <ContextMenu.Item className="context-menu-item" onSelect={handleQueueTop}>
              {chrome.i18n.getMessage('queueTop')}
            </ContextMenu.Item>
            <ContextMenu.Item className="context-menu-item" onSelect={handleQueueUp}>
              {chrome.i18n.getMessage('up')}
            </ContextMenu.Item>
            <ContextMenu.Item className="context-menu-item" onSelect={handleQueueDown}>
              {chrome.i18n.getMessage('down')}
            </ContextMenu.Item>
            <ContextMenu.Item className="context-menu-item" onSelect={handleQueueBottom}>
              {chrome.i18n.getMessage('queueBottom')}
            </ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Portal>
      </ContextMenu.Sub>

      {selectedIds.length === 1 && (
        <>
          <ContextMenu.Separator className="context-menu-separator" />
          <ContextMenu.Item className="context-menu-item" onSelect={handleShowFiles}>
            {chrome.i18n.getMessage('showFileList')}
          </ContextMenu.Item>
          <ContextMenu.Item className="context-menu-item" onSelect={handleShowProperties}>
            {chrome.i18n.getMessage('properties')}
          </ContextMenu.Item>
        </>
      )}
    </ContextMenu.Content>
  );
});

export default TorrentContextMenu;
