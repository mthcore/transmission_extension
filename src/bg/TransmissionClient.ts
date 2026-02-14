import TransmissionTransport from './TransmissionTransport';
import type { TransmissionResponse } from './TransmissionTransport';
import TorrentService, {
  type NormalizedTorrent,
  type PeerData,
  type TorrentDetailData,
  type TrackerStat,
} from './TorrentService';
import FileService, { type NormalizedFile } from './FileService';
import SettingsService, { type NormalizedSettings } from './SettingsService';
import type { Folder } from '../types/bg';

interface BgStore {
  config: {
    url: string;
    authenticationRequired: boolean;
    login: string;
    password: string;
    showDownloadCompleteNotifications: boolean;
  };
  client: {
    activeTorrentIds: number[];
    torrentIds: number[];
    removeTorrentByIds: (ids: number[]) => void;
    syncChanges: (torrents: NormalizedTorrent[]) => void;
    sync: (torrents: NormalizedTorrent[]) => void;
    torrents: Map<number, { stateText: string }>;
    currentSpeed: { downloadSpeed: number; uploadSpeed: number };
    speedRoll: { add: (download: number, upload: number) => void };
    setSettings: (settings: NormalizedSettings) => void;
  };
  flushClient: () => void;
}

interface Bg {
  bgStore: BgStore;
  daemon: { isActive: boolean; start: () => void };
  torrentCompleteNotify: (torrent: { stateText: string }) => void;
  torrentAddedNotify: (torrent: { id: number; name?: string }) => void;
  torrentIsExistsNotify: (torrent: { id: number; name?: string }) => void;
  torrentErrorNotify: (message: string) => void;
}

class TransmissionClient {
  private transport: TransmissionTransport;
  private torrentService: TorrentService;
  private fileService: FileService;
  private settingsService: SettingsService;

  constructor(bg: Bg) {
    const bgStore = bg.bgStore;

    this.transport = new TransmissionTransport({
      url: bgStore.config.url,
      getConfig: () => bgStore.config,
      onConnected: () => {
        if (!bg.daemon.isActive) {
          bg.daemon.start();
        }
      },
      onTokenRefresh: () => {
        this.torrentService.resetResponseTime();
      },
    });

    this.torrentService = new TorrentService({
      transport: this.transport,
      clientStore: bgStore.client,
      notifier: bg,
      getShowNotifications: () => bgStore.config.showDownloadCompleteNotifications,
    });

    this.fileService = new FileService(this.transport);

    this.settingsService = new SettingsService(this.transport, (settings) =>
      bgStore.client.setSettings(settings)
    );
  }

  // Torrent operations
  updateTorrents(force?: boolean): Promise<TransmissionResponse> {
    return this.torrentService.updateTorrents(force);
  }
  start(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.start(ids);
  }
  forcestart(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.forcestart(ids);
  }
  stop(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.stop(ids);
  }
  recheck(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.recheck(ids);
  }
  removetorrent(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.removetorrent(ids);
  }
  removedatatorrent(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.removedatatorrent(ids);
  }
  rename(ids: number[], path: string, name: string): Promise<TransmissionResponse> {
    return this.torrentService.rename(ids, path, name);
  }
  torrentSetLocation(ids: number[], location: string): Promise<TransmissionResponse> {
    return this.torrentService.torrentSetLocation(ids, location);
  }
  setLabels(ids: number[], labels: string[]): Promise<TransmissionResponse> {
    return this.torrentService.setLabels(ids, labels);
  }
  setBandwidthPriority(ids: number[], priority: number): Promise<TransmissionResponse> {
    return this.torrentService.setBandwidthPriority(ids, priority);
  }
  reannounce(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.reannounce(ids);
  }
  queueTop(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.queueTop(ids);
  }
  queueUp(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.queueUp(ids);
  }
  queueDown(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.queueDown(ids);
  }
  queueBottom(ids: number[]): Promise<TransmissionResponse> {
    return this.torrentService.queueBottom(ids);
  }
  sendFiles(urls: string[], directory?: Folder): Promise<TransmissionResponse> {
    return this.torrentService.sendFiles(urls, directory);
  }
  putTorrent(data: { blob?: Blob; url?: string }, directory?: Folder): Promise<void> {
    return this.torrentService.putTorrent(data, directory);
  }
  getPeers(id: number): Promise<PeerData[]> {
    return this.torrentService.getPeers(id);
  }
  getTorrentDetails(id: number): Promise<TorrentDetailData> {
    return this.torrentService.getTorrentDetails(id);
  }
  setTrackerList(ids: number[], trackerList: string): Promise<TransmissionResponse> {
    return this.torrentService.setTrackerList(ids, trackerList);
  }
  setSeedLimits(
    ids: number[],
    seedRatioMode: number,
    seedRatioLimit: number,
    seedIdleMode: number,
    seedIdleLimit: number
  ): Promise<TransmissionResponse> {
    return this.torrentService.setSeedLimits(
      ids,
      seedRatioMode,
      seedRatioLimit,
      seedIdleMode,
      seedIdleLimit
    );
  }

  // File operations
  getFileList(id: number): Promise<NormalizedFile[]> {
    return this.fileService.getFileList(id);
  }
  setPriority(id: number, level: number, idxs: number[]): Promise<unknown[]> {
    return this.fileService.setPriority(id, level, idxs);
  }

  // Settings operations
  updateSettings(): Promise<void> {
    return this.settingsService.updateSettings();
  }
  getFreeSpace(path: string): Promise<{ path: string; sizeBytes: number }> {
    return this.settingsService.getFreeSpace(path);
  }
  setDownloadSpeedLimitEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setDownloadSpeedLimitEnabled(enabled);
  setDownloadSpeedLimit = (speed: number): Promise<void> =>
    this.settingsService.setDownloadSpeedLimit(speed);
  setUploadSpeedLimitEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setUploadSpeedLimitEnabled(enabled);
  setUploadSpeedLimit = (speed: number): Promise<void> =>
    this.settingsService.setUploadSpeedLimit(speed);
  setAltSpeedEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setAltSpeedEnabled(enabled);
  setAltDownloadSpeedLimit = (speed: number): Promise<void> =>
    this.settingsService.setAltDownloadSpeedLimit(speed);
  setAltUploadSpeedLimit = (speed: number): Promise<void> =>
    this.settingsService.setAltUploadSpeedLimit(speed);
  setBlocklistEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setBlocklistEnabled(enabled);
  setBlocklistUrl = (url: string): Promise<void> => this.settingsService.setBlocklistUrl(url);
  blocklistUpdate(): Promise<{ blocklistSize: number }> {
    return this.settingsService.blocklistUpdate();
  }
  setPeerLimitGlobal = (limit: number): Promise<void> =>
    this.settingsService.setPeerLimitGlobal(limit);
  setPeerLimitPerTorrent = (limit: number): Promise<void> =>
    this.settingsService.setPeerLimitPerTorrent(limit);
  setSeedRatioLimited = (enabled: boolean): Promise<void> =>
    this.settingsService.setSeedRatioLimited(enabled);
  setSeedRatioLimit = (limit: number): Promise<void> =>
    this.settingsService.setSeedRatioLimit(limit);
  setIdleSeedingLimitEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setIdleSeedingLimitEnabled(enabled);
  setIdleSeedingLimit = (limit: number): Promise<void> =>
    this.settingsService.setIdleSeedingLimit(limit);
  setPeerPort = (port: number): Promise<void> => this.settingsService.setPeerPort(port);
  setPortForwardingEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setPortForwardingEnabled(enabled);
  setEncryption = (mode: string): Promise<void> => this.settingsService.setEncryption(mode);
  setDhtEnabled = (enabled: boolean): Promise<void> => this.settingsService.setDhtEnabled(enabled);
  setPexEnabled = (enabled: boolean): Promise<void> => this.settingsService.setPexEnabled(enabled);
  setLpdEnabled = (enabled: boolean): Promise<void> => this.settingsService.setLpdEnabled(enabled);
  setUtpEnabled = (enabled: boolean): Promise<void> => this.settingsService.setUtpEnabled(enabled);
  setIncompleteDirEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setIncompleteDirEnabled(enabled);
  setIncompleteDir = (dir: string): Promise<void> => this.settingsService.setIncompleteDir(dir);
  setRenamePartialFiles = (enabled: boolean): Promise<void> =>
    this.settingsService.setRenamePartialFiles(enabled);
  setDownloadQueueEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setDownloadQueueEnabled(enabled);
  setDownloadQueueSize = (size: number): Promise<void> =>
    this.settingsService.setDownloadQueueSize(size);
  setSeedQueueEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setSeedQueueEnabled(enabled);
  setSeedQueueSize = (size: number): Promise<void> => this.settingsService.setSeedQueueSize(size);
  setQueueStalledEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setQueueStalledEnabled(enabled);
  setQueueStalledMinutes = (minutes: number): Promise<void> =>
    this.settingsService.setQueueStalledMinutes(minutes);
  setStartAddedTorrents = (enabled: boolean): Promise<void> =>
    this.settingsService.setStartAddedTorrents(enabled);
  setTrashOriginalTorrentFiles = (enabled: boolean): Promise<void> =>
    this.settingsService.setTrashOriginalTorrentFiles(enabled);
  setAltSpeedTimeEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setAltSpeedTimeEnabled(enabled);
  setAltSpeedTimeBegin = (minutes: number): Promise<void> =>
    this.settingsService.setAltSpeedTimeBegin(minutes);
  setAltSpeedTimeEnd = (minutes: number): Promise<void> =>
    this.settingsService.setAltSpeedTimeEnd(minutes);
  setAltSpeedTimeDay = (day: number): Promise<void> => this.settingsService.setAltSpeedTimeDay(day);
  setScriptTorrentDoneEnabled = (enabled: boolean): Promise<void> =>
    this.settingsService.setScriptTorrentDoneEnabled(enabled);
  setScriptTorrentDoneFilename = (filename: string): Promise<void> =>
    this.settingsService.setScriptTorrentDoneFilename(filename);
  portTest(): Promise<boolean> {
    return this.settingsService.portTest();
  }

  destroy(): void {
    // Cleanup
  }
}

export default TransmissionClient;
