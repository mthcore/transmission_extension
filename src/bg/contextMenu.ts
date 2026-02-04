import "whatwg-fetch";
import getLogger from "../tools/getLogger";
import downloadFileFromTab from "../tools/downloadFileFromTab";
import isFirefox from "../tools/isFirefox";
import downloadFileFromUrl from "../tools/downloadFileFromUrl";
import type { IBgForContextMenu, Folder } from "../types";

const path = require('path');
const promiseLimit = require('promise-limit');

const logger = getLogger('ContextMenu');
const oneThread = promiseLimit(1);

interface MenuItemInfo {
  type: string;
  name?: string;
  index?: number;
  source?: string;
}

interface MenuItem {
  name: string;
  id: string;
  parentId?: string;
}

class ContextMenu {
  bg: IBgForContextMenu;

  constructor(bg: IBgForContextMenu) {
    this.bg = bg;

    this.bindClick();
  }

  get bgStore(): IBgForContextMenu['bgStore'] {
    return this.bg.bgStore;
  }

  bindClick(): void {
    if (!chrome.contextMenus.onClicked.hasListener(this.handleClick)) {
      chrome.contextMenus.onClicked.addListener(this.handleClick);
    }
  }

  onCreateFolder(): void {
    if (isFirefox()) {
      chrome.tabs.create({ url: '/options.html#/ctx' });
      return;
    }

    const firstFolder = this.bg.bgStore.config.folders[0];
    const promptPath = prompt(chrome.i18n.getMessage('enterNewDirPath'), firstFolder?.path);
    if (promptPath) {
      if (!this.bg.bgStore.config.hasFolder(promptPath)) {
        this.bg.bgStore.config.addFolder(promptPath);
      }
    }
  }

  onSendLink(url: string, tabId: number, frameId: number | undefined, directory?: Folder): Promise<void> {
    return downloadFileFromTab(url, tabId, frameId).catch((err) => {
      if (['FILE_SIZE_EXCEEDED', 'LINK_IS_NOT_SUPPORTED'].indexOf(err.code) === -1) {
        logger.error('onSendLink: downloadFileFromTab error, fallback to downloadFileFromUrl', err);
        return downloadFileFromUrl(url);
      }
      throw err;
    }).catch((err) => {
      if (err.code === 'FILE_SIZE_EXCEEDED') {
        this.bg.torrentErrorNotify(chrome.i18n.getMessage('fileSizeError'));
        throw err;
      }
      if (err.code !== 'LINK_IS_NOT_SUPPORTED') {
        logger.error('onSendLink: downloadFileFromUrl error, fallback to url', err);
      }
      return { url };
    }).then((data) => {
      if (!this.bg.client) throw new Error('Client not initialized');
      return this.bg.client.putTorrent(data, directory);
    }).then(() => {
      if (this.bgStore.config.selectDownloadCategoryAfterPutTorrentFromContextMenu) {
        this.bgStore.config.setSelectedLabel('DL', true);
      }
      if (!this.bg.client) throw new Error('Client not initialized');
      return this.bg.client.updateTorrents();
    }).then(() => {
      // void return
    }).catch((err) => {
      logger.error('onSendLink error', err);
    });
  }

  handleClick = (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): void => {
    const { menuItemId, linkUrl, frameId } = info;
    let itemInfo: MenuItemInfo;
    try {
      itemInfo = JSON.parse(menuItemId as string);
    } catch (err) {
      logger.error('Invalid menuItemId JSON', err);
      return;
    }
    switch (itemInfo.type) {
      case 'action': {
        switch (itemInfo.name) {
          case 'default': {
            this.bg.whenReady().then(() => {
              if (!linkUrl || !tab?.id) return;
              return this.onSendLink(linkUrl, tab.id, frameId);
            }).catch((err) => {
              logger.error('handleClick default error', err);
            });
            break;
          }
          case 'createFolder': {
            this.bg.whenReady().then(() => {
              return this.onCreateFolder();
            }).catch((err) => {
              logger.error('handleClick createFolder error', err);
            });
            break;
          }
        }
        break;
      }
      case 'folder': {
        this.bg.whenReady().then(() => {
          if (!linkUrl || !tab?.id || itemInfo.index === undefined) return;
          const folder = this.bgStore.config.folders[itemInfo.index];
          return this.onSendLink(linkUrl, tab.id, frameId, folder);
        }).catch((err) => {
          logger.error('handleClick folder error', err);
        });
        break;
      }
    }
  };

  create(): Promise<void> {
    return oneThread(() => {
      return contextMenusRemoveAll().then(() => {
        const menuId = JSON.stringify({ type: 'action', name: 'default', source: 'main' });
        return contextMenusCreate({
          id: menuId,
          title: chrome.i18n.getMessage('addInTorrentClient'),
          contexts: ['link']
        }).then(() => {
          return this.createFolderMenu(menuId);
        });
      });
    });
  }

  async createFolderMenu(parentId: string): Promise<void> {
    const folders = this.bgStore.config.folders;
    if (this.bgStore.config.treeViewContextMenu) {
      await Promise.all(transformFoldersToTree(folders).map((menuItem) => {
        let name = menuItem.name;
        if (name === './') {
          name = chrome.i18n.getMessage('currentDirectory');
        }
        return contextMenusCreate({
          id: menuItem.id,
          parentId: menuItem.parentId || parentId,
          title: name,
          contexts: ['link']
        });
      }));
    } else {
      await Promise.all(folders.map((folder, index) => {
        return contextMenusCreate({
          id: JSON.stringify({ type: 'folder', index }),
          parentId: parentId,
          title: folder.name || folder.path,
          contexts: ['link']
        });
      }));
    }

    if (folders.length) {
      if (this.bgStore.config.putDefaultPathInContextMenu) {
        await contextMenusCreate({
          id: JSON.stringify({ type: 'action', name: 'default', source: 'folder' }),
          parentId: parentId,
          title: chrome.i18n.getMessage('defaultPath'),
          contexts: ['link']
        });
      }

      await contextMenusCreate({
        id: JSON.stringify({ type: 'action', name: 'createFolder' }),
        parentId: parentId,
        title: chrome.i18n.getMessage('add') + '...',
        contexts: ['link']
      });
    }
  }

  destroy(): void {
    // Cleanup
  }
}

function transformFoldersToTree(folders: Folder[]): MenuItem[] {
  const placeFolderMap: Record<string, Folder> = {};
  const places: string[] = [];

  let sep: string | null = null;

  folders.forEach((folder) => {
    const place = folder.path;
    if (sep === null) {
      if (place.indexOf('/') !== -1) {
        sep = '/';
      } else if (place.indexOf('\\') !== -1) {
        sep = '\\';
      }
    }
    let normPath = place.split(/[\\/]/).join('/');
    normPath = path.normalize(normPath);
    if (/\/$/.test(normPath)) {
      normPath = normPath.slice(0, -1);
    }
    placeFolderMap[normPath] = folder;
    places.push(normPath);
  });
  if (sep === null) {
    sep = '/';
  }

  const lowKeyMap: Record<string, string> = {};
  const tree: Record<string, unknown> = {};
  places.forEach((place) => {
    const parts = place.split('/');
    if (parts[0] === '') {
      parts.unshift(parts.splice(0, 2).join(sep ?? '/'));
    }

    let parentThree: Record<string, unknown> = tree;
    parts.forEach((part, index) => {
      const lowPart = parts.slice(0, index + 1).join('/').toLowerCase();
      let caseKey = lowKeyMap[lowPart];
      if (!caseKey) {
        caseKey = lowKeyMap[lowPart] = part;
      }
      let subTree = parentThree[caseKey] as Record<string, unknown> | undefined;
      if (!subTree) {
        subTree = parentThree[caseKey] = {};
      }
      if (index === parts.length - 1) {
        subTree['./'] = place;
      }
      parentThree = subTree;
    });
  });

  const joinSingleParts = (tree: Record<string, unknown>, part: string): void => {
    const subTree = tree[part];
    if (typeof subTree !== 'object' || subTree === null) return;

    const subParts = Object.keys(subTree as Record<string, unknown>);
    if (subParts.length === 1) {
      const subPart = subParts[0];
      if (subPart === './') {
        tree[part] = (subTree as Record<string, unknown>)[subPart];
      } else {
        const joinedPart = part + sep + subPart;
        delete tree[part];
        tree[joinedPart] = (subTree as Record<string, unknown>)[subPart];
        joinSingleParts(tree, joinedPart);
      }
    } else {
      subParts.forEach((subPart) => {
        joinSingleParts(subTree as Record<string, unknown>, subPart);
      });
    }
  };
  Object.keys(tree).forEach((part) => {
    joinSingleParts(tree, part);
  });

  const menus: MenuItem[] = [];
  const makeMenuItems = (tree: Record<string, unknown>, parentId?: string): void => {
    Object.entries(tree).forEach(([name, item]) => {
      if (typeof item === 'object' && item !== null) {
        const branch = item as Record<string, unknown>;
        const id = JSON.stringify({ type: 'branch', index: menus.length });
        menus.push({
          name: name,
          id,
          parentId
        });
        makeMenuItems(branch, id);
      } else {
        const place = item as string;
        const folder = placeFolderMap[place];
        const id = JSON.stringify({ type: 'folder', index: folders.indexOf(folder) });
        menus.push({
          name,
          id,
          parentId
        });
      }
    });
  };
  makeMenuItems(tree);

  return menus;
}

const contextMenusRemoveAll = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.removeAll(() => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve();
    });
  });
};

const contextMenusCreate = (details: chrome.contextMenus.CreateProperties): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.create(details, () => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve();
    });
  });
};

export default ContextMenu;
