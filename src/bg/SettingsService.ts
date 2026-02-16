import type TransmissionTransport from './TransmissionTransport';
import { readKey } from '../tools/rpcCompat';

export interface NormalizedSettings {
  downloadSpeedLimit: number;
  downloadSpeedLimitEnabled: boolean;
  uploadSpeedLimit: number;
  uploadSpeedLimitEnabled: boolean;
  altSpeedEnabled: boolean;
  altDownloadSpeedLimit: number;
  altUploadSpeedLimit: number;
  downloadDir: string;
  downloadDirFreeSpace: number;
  blocklistEnabled: boolean;
  blocklistUrl: string;
  blocklistSize: number;
  peerLimitGlobal: number;
  peerLimitPerTorrent: number;
  seedRatioLimit: number;
  seedRatioLimited: boolean;
  idleSeedingLimit: number;
  idleSeedingLimitEnabled: boolean;
  peerPort: number;
  portForwardingEnabled: boolean;
  encryption: string;
  dhtEnabled: boolean;
  pexEnabled: boolean;
  lpdEnabled: boolean;
  utpEnabled: boolean;
  incompleteDirEnabled: boolean;
  incompleteDir: string;
  renamePartialFiles: boolean;
  downloadQueueEnabled: boolean;
  downloadQueueSize: number;
  seedQueueEnabled: boolean;
  seedQueueSize: number;
  queueStalledEnabled: boolean;
  queueStalledMinutes: number;
  startAddedTorrents: boolean;
  trashOriginalTorrentFiles: boolean;
  altSpeedTimeEnabled: boolean;
  altSpeedTimeBegin: number;
  altSpeedTimeEnd: number;
  altSpeedTimeDay: number;
  scriptTorrentDoneEnabled: boolean;
  scriptTorrentDoneFilename: string;
}

class SettingsService {
  private transport: TransmissionTransport;
  private applySettings: (settings: NormalizedSettings) => void;

  constructor(
    transport: TransmissionTransport,
    applySettings: (settings: NormalizedSettings) => void
  ) {
    this.transport = transport;
    this.applySettings = applySettings;
  }

  updateSettings(): Promise<void> {
    return this.transport.sendAction({ method: 'session-get' }).then((response) => {
      const settings = response.arguments as Record<string, unknown>;
      this.transport.rpcVersion = readKey<number>(settings, 'rpc-version', 0);
      this.applySettings(this.normalizeSettings(settings));
    });
  }

  getFreeSpace(path: string): Promise<{ path: string; sizeBytes: number }> {
    return this.transport
      .sendAction({
        method: 'free-space',
        arguments: { path },
      })
      .then((response) => {
        const args = response.arguments as Record<string, unknown>;
        return {
          path: args.path as string,
          sizeBytes: readKey<number>(args, 'size-bytes', 0),
        };
      });
  }

  private thenUpdateSettings = (): Promise<void> => {
    return this.updateSettings();
  };

  private setSessionSetting(args: Record<string, unknown>): Promise<void> {
    return this.transport
      .sendAction({
        method: 'session-set',
        arguments: args,
      })
      .then(this.thenUpdateSettings);
  }

  setDownloadSpeedLimitEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'speed-limit-down-enabled': enabled });

  setDownloadSpeedLimit = (speed: number): Promise<void> =>
    this.setSessionSetting({ 'speed-limit-down-enabled': true, 'speed-limit-down': speed });

  setUploadSpeedLimitEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'speed-limit-up-enabled': enabled });

  setUploadSpeedLimit = (speed: number): Promise<void> =>
    this.setSessionSetting({ 'speed-limit-up-enabled': true, 'speed-limit-up': speed });

  setAltSpeedEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'alt-speed-enabled': enabled });

  setAltDownloadSpeedLimit = (speed: number): Promise<void> =>
    this.setSessionSetting({ 'alt-speed-enabled': true, 'alt-speed-down': speed });

  setAltUploadSpeedLimit = (speed: number): Promise<void> =>
    this.setSessionSetting({ 'alt-speed-enabled': true, 'alt-speed-up': speed });

  setBlocklistEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'blocklist-enabled': enabled });

  setBlocklistUrl = (url: string): Promise<void> =>
    this.setSessionSetting({ 'blocklist-url': url });

  setPeerLimitGlobal = (limit: number): Promise<void> =>
    this.setSessionSetting({ 'peer-limit-global': limit });

  setPeerLimitPerTorrent = (limit: number): Promise<void> =>
    this.setSessionSetting({ 'peer-limit-per-torrent': limit });

  setSeedRatioLimited = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ seedRatioLimited: enabled });

  setSeedRatioLimit = (limit: number): Promise<void> =>
    this.setSessionSetting({ seedRatioLimited: true, seedRatioLimit: limit });

  setIdleSeedingLimitEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'idle-seeding-limit-enabled': enabled });

  setIdleSeedingLimit = (limit: number): Promise<void> =>
    this.setSessionSetting({ 'idle-seeding-limit-enabled': true, 'idle-seeding-limit': limit });

  setPeerPort = (port: number): Promise<void> => this.setSessionSetting({ 'peer-port': port });

  setPortForwardingEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'port-forwarding-enabled': enabled });

  setEncryption = (mode: string): Promise<void> => this.setSessionSetting({ encryption: mode });

  setDhtEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'dht-enabled': enabled });

  setPexEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'pex-enabled': enabled });

  setLpdEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'lpd-enabled': enabled });

  setUtpEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'utp-enabled': enabled });

  setIncompleteDirEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'incomplete-dir-enabled': enabled });

  setIncompleteDir = (dir: string): Promise<void> =>
    this.setSessionSetting({ 'incomplete-dir': dir });

  setRenamePartialFiles = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'rename-partial-files': enabled });

  setDownloadQueueEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'download-queue-enabled': enabled });

  setDownloadQueueSize = (size: number): Promise<void> =>
    this.setSessionSetting({ 'download-queue-enabled': true, 'download-queue-size': size });

  setSeedQueueEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'seed-queue-enabled': enabled });

  setSeedQueueSize = (size: number): Promise<void> =>
    this.setSessionSetting({ 'seed-queue-enabled': true, 'seed-queue-size': size });

  setQueueStalledEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'queue-stalled-enabled': enabled });

  setQueueStalledMinutes = (minutes: number): Promise<void> =>
    this.setSessionSetting({ 'queue-stalled-enabled': true, 'queue-stalled-minutes': minutes });

  setStartAddedTorrents = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'start-added-torrents': enabled });

  setTrashOriginalTorrentFiles = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'trash-original-torrent-files': enabled });

  setAltSpeedTimeEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'alt-speed-time-enabled': enabled });

  setAltSpeedTimeBegin = (minutes: number): Promise<void> =>
    this.setSessionSetting({ 'alt-speed-time-begin': minutes });

  setAltSpeedTimeEnd = (minutes: number): Promise<void> =>
    this.setSessionSetting({ 'alt-speed-time-end': minutes });

  setAltSpeedTimeDay = (day: number): Promise<void> =>
    this.setSessionSetting({ 'alt-speed-time-day': day });

  setScriptTorrentDoneEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'script-torrent-done-enabled': enabled });

  setScriptTorrentDoneFilename = (filename: string): Promise<void> =>
    this.setSessionSetting({ 'script-torrent-done-filename': filename });

  portTest(): Promise<boolean> {
    return this.transport.sendAction({ method: 'port-test' }).then((response) => {
      const args = response.arguments as Record<string, unknown>;
      return readKey<boolean>(args, 'port-is-open', false);
    });
  }

  blocklistUpdate(): Promise<{ blocklistSize: number }> {
    return this.transport
      .sendAction({ method: 'blocklist-update' })
      .then((response) => {
        const args = response.arguments as Record<string, unknown>;
        return { blocklistSize: readKey<number>(args, 'blocklist-size', 0) };
      })
      .then((result) => {
        return this.updateSettings().then(() => result);
      });
  }

  private normalizeSettings = (settings: Record<string, unknown>): NormalizedSettings => {
    return {
      downloadSpeedLimit: readKey<number>(settings, 'speed-limit-down', 0),
      downloadSpeedLimitEnabled: readKey<boolean>(settings, 'speed-limit-down-enabled', false),
      uploadSpeedLimit: readKey<number>(settings, 'speed-limit-up', 0),
      uploadSpeedLimitEnabled: readKey<boolean>(settings, 'speed-limit-up-enabled', false),
      altSpeedEnabled: readKey<boolean>(settings, 'alt-speed-enabled', false),
      altDownloadSpeedLimit: readKey<number>(settings, 'alt-speed-down', 0),
      altUploadSpeedLimit: readKey<number>(settings, 'alt-speed-up', 0),
      downloadDir: readKey<string>(settings, 'download-dir', ''),
      downloadDirFreeSpace: readKey<number>(settings, 'download-dir-free-space', 0),
      blocklistEnabled: readKey<boolean>(settings, 'blocklist-enabled', false),
      blocklistUrl: readKey<string>(settings, 'blocklist-url', ''),
      blocklistSize: readKey<number>(settings, 'blocklist-size', 0),
      peerLimitGlobal: readKey<number>(settings, 'peer-limit-global', 200),
      peerLimitPerTorrent: readKey<number>(settings, 'peer-limit-per-torrent', 50),
      seedRatioLimit: (settings['seed_ratio_limit'] ?? settings['seedRatioLimit'] ?? 2.0) as number,
      seedRatioLimited: (settings['seed_ratio_limited'] ?? settings['seedRatioLimited'] ?? false) as boolean,
      idleSeedingLimit: readKey<number>(settings, 'idle-seeding-limit', 30),
      idleSeedingLimitEnabled: readKey<boolean>(settings, 'idle-seeding-limit-enabled', false),
      peerPort: readKey<number>(settings, 'peer-port', 51413),
      portForwardingEnabled: readKey<boolean>(settings, 'port-forwarding-enabled', false),
      encryption: (settings['encryption'] as string) ?? 'preferred',
      dhtEnabled: readKey<boolean>(settings, 'dht-enabled', true),
      pexEnabled: readKey<boolean>(settings, 'pex-enabled', true),
      lpdEnabled: readKey<boolean>(settings, 'lpd-enabled', true),
      utpEnabled: readKey<boolean>(settings, 'utp-enabled', true),
      incompleteDirEnabled: readKey<boolean>(settings, 'incomplete-dir-enabled', false),
      incompleteDir: readKey<string>(settings, 'incomplete-dir', ''),
      renamePartialFiles: readKey<boolean>(settings, 'rename-partial-files', true),
      downloadQueueEnabled: readKey<boolean>(settings, 'download-queue-enabled', true),
      downloadQueueSize: readKey<number>(settings, 'download-queue-size', 5),
      seedQueueEnabled: readKey<boolean>(settings, 'seed-queue-enabled', false),
      seedQueueSize: readKey<number>(settings, 'seed-queue-size', 10),
      queueStalledEnabled: readKey<boolean>(settings, 'queue-stalled-enabled', true),
      queueStalledMinutes: readKey<number>(settings, 'queue-stalled-minutes', 30),
      startAddedTorrents: readKey<boolean>(settings, 'start-added-torrents', true),
      trashOriginalTorrentFiles: readKey<boolean>(settings, 'trash-original-torrent-files', false),
      altSpeedTimeEnabled: readKey<boolean>(settings, 'alt-speed-time-enabled', false),
      altSpeedTimeBegin: readKey<number>(settings, 'alt-speed-time-begin', 540),
      altSpeedTimeEnd: readKey<number>(settings, 'alt-speed-time-end', 1020),
      altSpeedTimeDay: readKey<number>(settings, 'alt-speed-time-day', 127),
      scriptTorrentDoneEnabled: readKey<boolean>(settings, 'script-torrent-done-enabled', false),
      scriptTorrentDoneFilename: readKey<string>(settings, 'script-torrent-done-filename', ''),
    };
  };
}

export default SettingsService;
