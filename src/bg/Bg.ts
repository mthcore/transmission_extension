import getLogger from "../tools/getLogger";
import Daemon from "./Daemon";
import ContextMenu from "./ContextMenu";
import BgStore, { IBgStore } from "../stores/BgStore";
import { autorun } from "mobx";
import TransmissionClient from "./TransmissionClient";
import MobxPatchLine from "../tools/MobxPatchLine";
import { serializeError } from 'serialize-error';
import type { BgMessage, IBgForDaemon, IBgForContextMenu } from '../types';
import { getSnapshot } from "mobx-state-tree";

const logger = getLogger('background');

const notificationIcons = {
  complete: chrome.runtime.getURL('assets/img/notification_done.png'),
  add: chrome.runtime.getURL('assets/img/notification_add.png'),
  error: chrome.runtime.getURL('assets/img/notification_error.png'),
};

interface TorrentInfo {
  id: number;
  name: string;
  stateText?: string;
}

class Bg {
  bgStore: IBgStore;
  bgStorePathLine: MobxPatchLine;
  client: TransmissionClient | null;
  daemon: Daemon | null;
  contextMenu: ContextMenu | null;
  initPromise: Promise<void> | null;

  constructor() {
    this.bgStore = BgStore.create();
    // Cast to Record for MobxPatchLine compatibility with MST types
    this.bgStorePathLine = new MobxPatchLine(this.bgStore as unknown as Record<string, unknown>, ['client']);
    this.client = null;
    this.daemon = null;
    this.contextMenu = null;

    this.initPromise = null;

    this.init().catch((err) => {
      logger.error('init error', err);
    });
  }

  init(): Promise<void> {
    chrome.runtime.onMessage.addListener(this.handleMessage);
    // Cast needed because MST types with 'maybe' are complex
    this.daemon = new Daemon(this as unknown as IBgForDaemon);
    this.contextMenu = new ContextMenu(this as unknown as IBgForContextMenu);

    return this.initPromise = this.bgStore.fetchConfig().then(() => {
      const autorunLogger = getLogger('autorun');

      autorun(() => {
        autorunLogger.info('daemon');
        this.daemon?.start();
      });

      autorun(() => {
        autorunLogger.info('client');
        const config = this.bgStore.config;
        if (!config) return;

        const dep = [
          config.ssl,
          config.port,
          config.hostname,
          config.pathname,
          config.authenticationRequired,
        ];

        if (dep.length) {
          this.bgStore.flushClient();
          // Cast needed for TransmissionClient's Bg interface expectations
          this.client = new TransmissionClient(this as never);
          this.client.updateSettings().catch((err) => {
            autorunLogger.error('client', 'updateSettings error', err);
          });
          this.client.updateTorrents().catch((err) => {
            autorunLogger.error('client', 'updateTorrents error', err);
          });
        }
      });

      autorun(() => {
        autorunLogger.info('badge');
        const config = this.bgStore.config;
        if (!config) return;

        if (config.showActiveCountBadge) {
          const count = this.bgStore.client.activeCount;
          if (count > 0) {
            setBadgeText('' + count);
          } else {
            setBadgeText('');
          }
        } else {
          setBadgeText('');
        }
      });

      autorun(() => {
        autorunLogger.info('badgeColor');
        const config = this.bgStore.config;
        if (!config) return;

        setBadgeBackgroundColor(config.badgeColor);
      });

      autorun(() => {
        autorunLogger.info('contextMenu');
        const config = this.bgStore.config;
        if (!config) return;

        const dep = [
          config.folders.length,
          config.treeViewContextMenu,
          config.putDefaultPathInContextMenu
        ];

        if (dep.length) {
          this.contextMenu?.create();
        }
      });
    });
  }

  whenReady(): Promise<void> {
    return this.initPromise ?? Promise.resolve();
  }

  private requireClient(): TransmissionClient {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    return this.client;
  }

  handleMessage = (message: BgMessage, _sender: chrome.runtime.MessageSender, response: (result: unknown) => void): boolean | void => {
    let promise: Promise<unknown> | null = null;

    // Type narrowing happens automatically in each case block
    switch (message.action) {
      case 'getBgStoreDelta': {
        promise = this.whenReady().then(() => {
          return this.bgStorePathLine.getDelta(message.id, message.patchId);
        });
        break;
      }
      case 'getConfigStore': {
        promise = this.whenReady().then(() => {
          const config = this.bgStore.config;
          return config ? getSnapshot(config) : null;
        });
        break;
      }
      case 'updateTorrentList': {
        promise = this.whenReady().then(() => {
          return this.requireClient().updateTorrents(message.force);
        });
        break;
      }
      case 'start':
      case 'forcestart':
      case 'stop':
      case 'recheck':
      case 'removetorrent':
      case 'removedatatorrent':
      case 'reannounce': {
        const action = message.action;
        const ids = message.ids;
        promise = this.requireClient()[action](ids);
        break;
      }
      case 'queueTop':
      case 'queueUp':
      case 'queueDown':
      case 'queueBottom': {
        const action = message.action;
        const ids = message.ids;
        promise = this.requireClient()[action](ids);
        break;
      }
      case 'setPriority': {
        promise = this.requireClient().setPriority(message.id, message.level, message.fileIdxs);
        break;
      }
      case 'getFileList': {
        promise = this.requireClient().getFileList(message.id);
        break;
      }
      case 'setDownloadSpeedLimitEnabled':
      case 'setUploadSpeedLimitEnabled': {
        const action = message.action;
        const enabled = message.enabled;
        promise = this.whenReady().then(() => {
          return this.requireClient()[action](enabled);
        });
        break;
      }
      case 'setDownloadSpeedLimit':
      case 'setUploadSpeedLimit': {
        const action = message.action;
        const speed = message.speed;
        promise = this.whenReady().then(() => {
          return this.requireClient()[action](speed);
        });
        break;
      }
      case 'setAltSpeedEnabled': {
        promise = this.whenReady().then(() => {
          return this.requireClient().setAltSpeedEnabled(message.enabled);
        });
        break;
      }
      case 'setAltUploadSpeedLimit':
      case 'setAltDownloadSpeedLimit': {
        const action = message.action;
        const speed = message.speed;
        promise = this.whenReady().then(() => {
          return this.requireClient()[action](speed);
        });
        break;
      }
      case 'updateSettings': {
        promise = this.whenReady().then(() => {
          return this.requireClient().updateSettings();
        });
        break;
      }
      case 'sendFiles': {
        promise = this.whenReady().then(() => {
          return this.requireClient().sendFiles(message.urls, message.directory);
        });
        break;
      }
      case 'getFreeSpace': {
        promise = this.whenReady().then(() => {
          return this.requireClient().getFreeSpace(message.path);
        });
        break;
      }
      case 'rename': {
        promise = this.requireClient().rename(message.ids, message.path, message.name);
        break;
      }
      case 'torrentSetLocation': {
        promise = this.requireClient().torrentSetLocation(message.ids, message.location);
        break;
      }
      default: {
        // Exhaustive check - TypeScript will error if a case is missing
        const _exhaustiveCheck: never = message;
        promise = Promise.reject(new Error(`Unknown request: ${(_exhaustiveCheck as BgMessage).action}`));
      }
    }

    if (promise) {
      promise.then((result) => {
        response({ result });
      }, (err) => {
        response({ error: serializeError(err) });
      }).catch((err) => {
        logger.error('Send response error', err);
      });
      return true;
    }
  };

  torrentAddedNotify(torrent: TorrentInfo): void {
    const icon = notificationIcons.add;
    const statusText = chrome.i18n.getMessage('torrentAdded');
    showNotification('added-' + torrent.id, icon, torrent.name, statusText);
  }

  torrentIsExistsNotify(torrent: TorrentInfo): void {
    const icon = notificationIcons.error;
    const title = chrome.i18n.getMessage('torrentFileIsExists');
    showNotification('exists-' + torrent.id, icon, torrent.name, title);
  }

  torrentExistsNotify(): void {
    const icon = notificationIcons.error;
    const title = chrome.i18n.getMessage('torrentFileExists');
    showNotification('exists-' + Date.now(), icon, title);
  }

  torrentCompleteNotify(torrent: TorrentInfo): void {
    const icon = notificationIcons.complete;
    const statusText = chrome.i18n.getMessage('OV_COL_STATUS') + ': ' + torrent.stateText;
    showNotification('complete-' + torrent.id, icon, torrent.name, statusText);
  }

  torrentErrorNotify(message: string): void {
    const icon = notificationIcons.error;
    const title = chrome.i18n.getMessage('OV_FL_ERROR');
    showNotification('error-' + Date.now(), icon, title, message);
  }
}

function setBadgeText(text: string): void {
  chrome.action.setBadgeText({ text: text });
}

function showNotification(id: string, iconUrl: string, title = '', message = ''): void {
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: iconUrl,
    title: title,
    message: message
  });
}

function setBadgeBackgroundColor(color: string): void {
  const colors = color.split(',').map(i => parseFloat(i));
  if (colors.length === 4) {
    const alpha = colors.pop();
    if (alpha !== undefined) {
      colors.push(Math.round(255 * alpha));
    }
  }
  chrome.action.setBadgeBackgroundColor({ color: colors as [number, number, number, number] });
}

declare const self: Window & { bg: Bg };

const bg = self.bg = new Bg();

export default bg;
