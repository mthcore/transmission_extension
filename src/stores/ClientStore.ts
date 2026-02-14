import { getRoot, types, Instance, cast } from 'mobx-state-tree';
import SpeedRollStore from './SpeedRollStore';
import { speedToStr, formatBytes } from '../tools/format';
import TorrentStore, { ITorrentStore } from './TorrentStore';
import callApi from '../tools/callApi';
import getLogger from '../tools/getLogger';

const logger = getLogger('ClientStore');

interface TorrentSnapshot {
  id: number;
  [key: string]: unknown;
}

interface FileData {
  name: string;
  shortName: string;
  size: number;
  downloaded: number;
  priority: number;
}

interface PeerData {
  address: string;
  client: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  flags: string;
}

const SettingsStore = types
  .model('SettingsStore', {
    downloadSpeedLimit: types.number,
    downloadSpeedLimitEnabled: types.boolean,
    uploadSpeedLimit: types.number,
    uploadSpeedLimitEnabled: types.boolean,
    altSpeedEnabled: types.boolean,
    altDownloadSpeedLimit: types.number,
    altUploadSpeedLimit: types.number,
    downloadDir: types.string,
    downloadDirFreeSpace: types.maybe(types.number),
    blocklistEnabled: types.optional(types.boolean, false),
    blocklistUrl: types.optional(types.string, ''),
    blocklistSize: types.optional(types.number, 0),
    peerLimitGlobal: types.optional(types.number, 200),
    peerLimitPerTorrent: types.optional(types.number, 50),
    seedRatioLimit: types.optional(types.number, 2.0),
    seedRatioLimited: types.optional(types.boolean, false),
    idleSeedingLimit: types.optional(types.number, 30),
    idleSeedingLimitEnabled: types.optional(types.boolean, false),
    peerPort: types.optional(types.number, 51413),
    portForwardingEnabled: types.optional(types.boolean, false),
    encryption: types.optional(types.string, 'preferred'),
    dhtEnabled: types.optional(types.boolean, true),
    pexEnabled: types.optional(types.boolean, true),
    lpdEnabled: types.optional(types.boolean, true),
    utpEnabled: types.optional(types.boolean, true),
  })
  .views((self) => {
    return {
      get downloadSpeedLimitStr(): string {
        return speedToStr(self.downloadSpeedLimit * 1024);
      },
      get uploadSpeedLimitStr(): string {
        return speedToStr(self.uploadSpeedLimit * 1024);
      },
      get altDownloadSpeedLimitStr(): string {
        return speedToStr(self.altDownloadSpeedLimit * 1024);
      },
      get altUploadSpeedLimitStr(): string {
        return speedToStr(self.altUploadSpeedLimit * 1024);
      },
      get hasDownloadDirFreeSpace(): boolean {
        return typeof self.downloadDirFreeSpace === 'number';
      },
    };
  });

export type ISettingsStore = Instance<typeof SettingsStore>;

const ClientStore = types
  .model('ClientStore', {
    torrents: types.map(TorrentStore),
    settings: types.maybe(SettingsStore),
    speedRoll: types.optional(SpeedRollStore, {}),
    lastErrorMessage: types.maybe(types.string),
  })
  .actions((self) => {
    return {
      removeTorrentByIds(ids: number[]) {
        ids.forEach((id) => {
          self.torrents.delete(String(id));
        });
      },
      sync(torrents: TorrentSnapshot[]) {
        const removedIds = (self as IClientStoreViews).torrentIds.slice();

        torrents.forEach((torrent) => {
          const id = torrent.id;
          const pos = removedIds.indexOf(id);
          if (pos !== -1) {
            removedIds.splice(pos, 1);
          }
          self.torrents.set(String(id), torrent as never);
        });

        // Cast needed because TypeScript can't see actions defined in the same block
        (self as unknown as IClientStoreActions).removeTorrentByIds(removedIds);
      },
      syncChanges(torrents: TorrentSnapshot[]) {
        torrents.forEach((torrent) => {
          self.torrents.set(String(torrent.id), torrent as never);
        });
      },
      setTorrents(torrents: Map<string, ITorrentStore>) {
        // MST cast issue - convert Map to plain object then cast
        const torrentsObj: Record<string, ITorrentStore> = {};
        torrents.forEach((torrent, key) => {
          torrentsObj[key] = torrent;
        });
        self.torrents = cast(torrentsObj);
      },
      setSettings(settings: ISettingsStore) {
        self.settings = settings;
      },
      setLastErrorMessage(message: string | undefined) {
        self.lastErrorMessage = message;
      },
    };
  })
  .views((self) => {
    const exceptionLog = (): [(result: unknown) => unknown, (err: Error) => never] => {
      return [
        (result) => {
          self.setLastErrorMessage(undefined);
          return result;
        },
        (err) => {
          logger.error('exceptionLog', err);
          self.setLastErrorMessage(`${err.name}: ${err.message || 'Unknown error'}`);
          throw err;
        },
      ];
    };

    const thenSyncClient = (result: unknown) => {
      return (self as IClientStoreViews).syncClient().then(() => result);
    };

    const createTorrentAction =
      (action: string, sync = true) =>
      (ids: number[]): Promise<unknown> => {
        const promise = callApi({ action, ids }).then(...exceptionLog());
        return sync ? promise.then(thenSyncClient) : promise;
      };

    return {
      get torrentIds(): number[] {
        const result: number[] = [];
        for (const torrent of self.torrents.values()) {
          result.push(torrent.id);
        }
        return result;
      },
      get activeTorrentIds(): number[] {
        const result: number[] = [];
        for (const torrent of self.torrents.values()) {
          if (!torrent.isCompleted) {
            result.push(torrent.id);
          }
        }
        return result;
      },
      get activeCount(): number {
        return this.activeTorrentIds.length;
      },
      get currentSpeed(): { downloadSpeed: number; uploadSpeed: number } {
        let downloadSpeed = 0;
        let uploadSpeed = 0;
        for (const torrent of self.torrents.values()) {
          downloadSpeed += torrent.downloadSpeed;
          uploadSpeed += torrent.uploadSpeed;
        }
        return { downloadSpeed, uploadSpeed };
      },
      get currentSpeedStr(): { downloadSpeedStr: string; uploadSpeedStr: string } {
        const { downloadSpeed, uploadSpeed } = this.currentSpeed;
        return {
          downloadSpeedStr: downloadSpeed === 0 ? '-' : speedToStr(downloadSpeed),
          uploadSpeedStr: uploadSpeed === 0 ? '-' : speedToStr(uploadSpeed),
        };
      },
      get sessionTotals(): { downloaded: number; uploaded: number } {
        let downloaded = 0;
        let uploaded = 0;
        for (const torrent of self.torrents.values()) {
          downloaded += torrent.downloaded;
          uploaded += torrent.uploaded;
        }
        return { downloaded, uploaded };
      },
      get sessionTotalsStr(): { downloadedStr: string; uploadedStr: string } {
        const { downloaded, uploaded } = this.sessionTotals;
        return {
          downloadedStr: formatBytes(downloaded),
          uploadedStr: formatBytes(uploaded),
        };
      },
      torrentsStart: createTorrentAction('start'),
      torrentsForceStart: createTorrentAction('forcestart'),
      torrentsStop: createTorrentAction('stop'),
      torrentsRecheck: createTorrentAction('recheck'),
      torrentsRemoveTorrent: createTorrentAction('removetorrent'),
      torrentsRemoveTorrentFiles: createTorrentAction('removedatatorrent'),
      torrentsQueueTop: createTorrentAction('queueTop'),
      torrentsQueueUp: createTorrentAction('queueUp'),
      torrentsQueueDown: createTorrentAction('queueDown'),
      torrentsQueueBottom: createTorrentAction('queueBottom'),
      filesSetPriority(id: number, fileIdxs: number[], level: number): Promise<unknown> {
        return callApi({ action: 'setPriority', level, id, fileIdxs }).then(...exceptionLog());
      },
      setDownloadSpeedLimitEnabled(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setDownloadSpeedLimitEnabled', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setDownloadSpeedLimit(speed: number): Promise<unknown> {
        return callApi({ action: 'setDownloadSpeedLimit', speed })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setUploadSpeedLimitEnabled(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setUploadSpeedLimitEnabled', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setUploadSpeedLimit(speed: number): Promise<unknown> {
        return callApi({ action: 'setUploadSpeedLimit', speed })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setAltSpeedEnabled(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setAltSpeedEnabled', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setAltDownloadSpeedLimit(speed: number): Promise<unknown> {
        return callApi({ action: 'setAltDownloadSpeedLimit', speed })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setAltUploadSpeedLimit(speed: number): Promise<unknown> {
        return callApi({ action: 'setAltUploadSpeedLimit', speed })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setBlocklistEnabled(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setBlocklistEnabled', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setBlocklistUrl(url: string): Promise<unknown> {
        return callApi({ action: 'setBlocklistUrl', url })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setSeedRatioLimited(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setSeedRatioLimited', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setIdleSeedingLimitEnabled(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setIdleSeedingLimitEnabled', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setPortForwardingEnabled(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setPortForwardingEnabled', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setDhtEnabled(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setDhtEnabled', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setPexEnabled(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setPexEnabled', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setLpdEnabled(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setLpdEnabled', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setUtpEnabled(enabled: boolean): Promise<unknown> {
        return callApi({ action: 'setUtpEnabled', enabled })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setPeerLimitGlobal(limit: number): Promise<unknown> {
        return callApi({ action: 'setPeerLimitGlobal', value: limit })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setPeerLimitPerTorrent(limit: number): Promise<unknown> {
        return callApi({ action: 'setPeerLimitPerTorrent', value: limit })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setSeedRatioLimit(limit: number): Promise<unknown> {
        return callApi({ action: 'setSeedRatioLimit', value: limit })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setIdleSeedingLimit(limit: number): Promise<unknown> {
        return callApi({ action: 'setIdleSeedingLimit', value: limit })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setPeerPort(port: number): Promise<unknown> {
        return callApi({ action: 'setPeerPort', value: port })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setEncryption(mode: string): Promise<unknown> {
        return callApi({ action: 'setEncryption', mode })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      blocklistUpdate(): Promise<{ blocklistSize: number }> {
        return callApi<{ blocklistSize: number }>({ action: 'blocklistUpdate' })
          .then(...exceptionLog())
          .then(thenSyncClient) as Promise<{ blocklistSize: number }>;
      },
      getTorrentFiles(id: number): Promise<FileData[]> {
        return callApi<FileData[]>({ action: 'getFileList', id }).then(
          ...exceptionLog()
        ) as Promise<FileData[]>;
      },
      getPeers(id: number): Promise<PeerData[]> {
        return callApi<PeerData[]>({ action: 'getPeers', id }).then(
          ...exceptionLog()
        ) as Promise<PeerData[]>;
      },
      updateSettings(): Promise<unknown> {
        return callApi({ action: 'updateSettings' })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      sendFiles(urls: string[], directory?: string): Promise<unknown> {
        return callApi({ action: 'sendFiles', urls, directory })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      getFreeSpace(path: string): Promise<{ path: string; sizeBytes: number }> {
        return callApi<{ path: string; sizeBytes: number }>({ action: 'getFreeSpace', path }).then(
          ...exceptionLog()
        ) as Promise<{ path: string; sizeBytes: number }>;
      },
      reannounce(ids: number[]): Promise<unknown> {
        return callApi({ action: 'reannounce', ids }).then(...exceptionLog());
      },
      rename(ids: number[], path: string, name: string): Promise<unknown> {
        return callApi({ action: 'rename', ids, path, name })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      torrentSetLocation(ids: number[], location: string): Promise<unknown> {
        return callApi({ action: 'torrentSetLocation', ids, location })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setLabels(ids: number[], labels: string[]): Promise<unknown> {
        return callApi({ action: 'setLabels', ids, labels })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      setBandwidthPriority(ids: number[], priority: number): Promise<unknown> {
        return callApi({ action: 'setBandwidthPriority', ids, priority })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      updateTorrentList(force?: boolean): Promise<unknown> {
        return callApi({ action: 'updateTorrentList', force })
          .then(...exceptionLog())
          .then(thenSyncClient);
      },
      syncClient(): Promise<unknown> {
        const rootStore = getRoot<{ syncClient: () => Promise<unknown> }>(self);
        return rootStore.syncClient().then(...exceptionLog());
      },
    };
  });

// Interface for actions that need to be referenced before they're visible to TypeScript
interface IClientStoreActions {
  removeTorrentByIds(ids: number[]): void;
}

interface IClientStoreViews extends Instance<typeof ClientStore> {
  torrentIds: number[];
  syncClient: () => Promise<unknown>;
}

export type IClientStore = Instance<typeof ClientStore>;
export default ClientStore;
