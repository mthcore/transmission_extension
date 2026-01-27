import { getRoot, types, Instance } from "mobx-state-tree";
import speedToStr from "../tools/speedToStr";
import getEta from "../tools/getEta";
import fecha from "fecha";
import formatBytes from "../tools/formatBytes";

const TorrentStore = types.model('TorrentStore', {
  id: types.identifierNumber,
  statusCode: types.number,
  errorCode: types.number,
  errorString: types.string,
  name: types.string,
  size: types.number,
  percentDone: types.number,
  recheckProgress: types.number,
  downloaded: types.number,
  uploaded: types.number,
  shared: types.number,
  uploadSpeed: types.number,
  downloadSpeed: types.number,
  eta: types.number,
  activePeers: types.number,
  peers: types.number,
  activeSeeds: types.number,
  seeds: types.number,
  order: types.maybe(types.number),
  addedTime: types.number,
  completedTime: types.number,
  directory: types.maybe(types.string),
  magnetLink: types.maybe(types.string),
}).views((self) => {
  return {
    start(): Promise<void> {
      const rootStore = getRoot<{
        client: { torrentsStart: (ids: number[]) => Promise<void> };
      }>(self);
      return rootStore.client.torrentsStart([self.id]);
    },
    stop(): Promise<void> {
      const rootStore = getRoot<{
        client: { torrentsStop: (ids: number[]) => Promise<void> };
      }>(self);
      return rootStore.client.torrentsStop([self.id]);
    },
    get remaining(): number {
      let result = self.size - self.downloaded;
      if (result < 0) {
        result = 0;
      }
      return result;
    },
    get remainingStr(): string {
      return formatBytes(this.remaining);
    },
    get isCompleted(): boolean {
      return self.percentDone === 1;
    },
    get sizeStr(): string {
      return formatBytes(self.size);
    },
    get progress(): number {
      return Math.trunc((self.recheckProgress || self.percentDone) * 1000);
    },
    get progressStr(): string {
      const progress = this.progress / 10;
      if (progress < 100) {
        return progress.toFixed(1) + '%';
      } else {
        return Math.round(progress) + '%';
      }
    },
    get recheckProgressStr(): string {
      return (self.recheckProgress * 100).toFixed(1) + '%';
    },
    get uploadSpeedStr(): string {
      if (self.uploadSpeed === 0) {
        return '';
      } else {
        return speedToStr(self.uploadSpeed);
      }
    },
    get downloadSpeedStr(): string {
      if (self.downloadSpeed === 0) {
        return '';
      } else {
        return speedToStr(self.downloadSpeed);
      }
    },
    get etaStr(): string {
      return getEta(self.eta);
    },
    get uploadedStr(): string {
      return formatBytes(self.uploaded);
    },
    get downloadedStr(): string {
      return formatBytes(self.downloaded);
    },
    get addedTimeStr(): string {
      if (!self.addedTime) {
        return '∞';
      } else {
        return fecha.format(new Date(self.addedTime * 1000), 'YYYY-MM-DD HH:mm:ss');
      }
    },
    get completedTimeStr(): string {
      if (!self.completedTime) {
        return '∞';
      } else {
        return fecha.format(new Date(self.completedTime * 1000), 'YYYY-MM-DD HH:mm:ss');
      }
    },
    get stateText(): string {
      switch (self.statusCode) {
        case 0: {
          if (self.percentDone === 1) {
            return chrome.i18n.getMessage('OV_FL_FINISHED');
          } else {
            return chrome.i18n.getMessage('OV_FL_STOPPED');
          }
        }
        case 1:
        case 3: {
          return chrome.i18n.getMessage('OV_FL_QUEUED');
        }
        case 2: {
          return chrome.i18n.getMessage('OV_FL_CHECKED') + ' ' + this.recheckProgressStr;
        }
        case 4: {
          return chrome.i18n.getMessage('OV_FL_DOWNLOADING');
        }
        case 5: {
          return chrome.i18n.getMessage('OV_FL_QUEUED_SEED');
        }
        case 6: {
          return chrome.i18n.getMessage('OV_FL_SEEDING');
        }
        default: {
          return `Unknown (${self.statusCode})`;
        }
      }
    },
    get errorMessage(): string {
      if (self.errorCode > 0) {
        let errorString = self.errorString;
        if (/^Error: /.test(errorString)) {
          errorString = errorString.substring(7);
        }
        if (errorString) {
          return chrome.i18n.getMessage('OV_FL_ERROR') + ': ' + errorString;
        }
        return chrome.i18n.getMessage('OV_FL_ERROR');
      }
      return '';
    },
    get selected(): boolean {
      const rootStore = getRoot<{
        torrentList: { _selectedIdsSet: Set<number> };
      }>(self);
      return rootStore.torrentList._selectedIdsSet.has(self.id);
    },
    get isStopped(): boolean {
      return self.statusCode === 0;
    },
    get isQueuedToCheckFiles(): boolean {
      return self.statusCode === 1;
    },
    get isChecking(): boolean {
      return self.statusCode === 2;
    },
    get isQueuedToDownload(): boolean {
      return self.statusCode === 3;
    },
    get isDownloading(): boolean {
      return self.statusCode === 4;
    },
    get isQueuedToSeed(): boolean {
      return self.statusCode === 5;
    },
    get isSeeding(): boolean {
      return self.statusCode === 6;
    },
    get actions(): string[] {
      const actions: string[] = [];

      if (!this.isChecking) {
        actions.push('recheck');
      }

      if (this.isStopped) {
        actions.push('start');
      } else {
        actions.push('stop');
      }

      if (this.isStopped || this.isQueuedToCheckFiles || this.isQueuedToDownload || this.isQueuedToSeed) {
        actions.push('forcestart');
      }

      return actions;
    },
    get isFinished(): boolean {
      return self.percentDone === 1 && this.isStopped;
    },
    get isActive(): boolean {
      return !!(self.downloadSpeed || self.uploadSpeed);
    },
    get hash(): string | null {
      if (!self.magnetLink) return null;
      const match = self.magnetLink.match(/urn:btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/i);
      return match ? match[1].toUpperCase() : null;
    }
  };
});

export type ITorrentStore = Instance<typeof TorrentStore>;
export default TorrentStore;
