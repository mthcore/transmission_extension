import type TransmissionTransport from './TransmissionTransport';

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
      this.applySettings(
        this.normalizeSettings(response.arguments as Record<string, unknown>)
      );
    });
  }

  getFreeSpace(path: string): Promise<{ path: string; sizeBytes: number }> {
    return this.transport
      .sendAction({
        method: 'free-space',
        arguments: { path },
      })
      .then((response) => {
        const args = response.arguments as { path: string; 'size-bytes': number };
        return {
          path: args.path,
          sizeBytes: args['size-bytes'],
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
    this.setSessionSetting({ 'seedRatioLimited': enabled });

  setSeedRatioLimit = (limit: number): Promise<void> =>
    this.setSessionSetting({ 'seedRatioLimited': true, 'seedRatioLimit': limit });

  setIdleSeedingLimitEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'idle-seeding-limit-enabled': enabled });

  setIdleSeedingLimit = (limit: number): Promise<void> =>
    this.setSessionSetting({ 'idle-seeding-limit-enabled': true, 'idle-seeding-limit': limit });

  setPeerPort = (port: number): Promise<void> =>
    this.setSessionSetting({ 'peer-port': port });

  setPortForwardingEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'port-forwarding-enabled': enabled });

  setEncryption = (mode: string): Promise<void> =>
    this.setSessionSetting({ encryption: mode });

  setDhtEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'dht-enabled': enabled });

  setPexEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'pex-enabled': enabled });

  setLpdEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'lpd-enabled': enabled });

  setUtpEnabled = (enabled: boolean): Promise<void> =>
    this.setSessionSetting({ 'utp-enabled': enabled });

  blocklistUpdate(): Promise<{ blocklistSize: number }> {
    return this.transport
      .sendAction({ method: 'blocklist-update' })
      .then((response) => {
        const args = response.arguments as { 'blocklist-size': number };
        return { blocklistSize: args['blocklist-size'] };
      })
      .then((result) => {
        return this.updateSettings().then(() => result);
      });
  }

  private normalizeSettings = (settings: Record<string, unknown>): NormalizedSettings => {
    return {
      downloadSpeedLimit: settings['speed-limit-down'] as number,
      downloadSpeedLimitEnabled: settings['speed-limit-down-enabled'] as boolean,
      uploadSpeedLimit: settings['speed-limit-up'] as number,
      uploadSpeedLimitEnabled: settings['speed-limit-up-enabled'] as boolean,
      altSpeedEnabled: settings['alt-speed-enabled'] as boolean,
      altDownloadSpeedLimit: settings['alt-speed-down'] as number,
      altUploadSpeedLimit: settings['alt-speed-up'] as number,
      downloadDir: settings['download-dir'] as string,
      downloadDirFreeSpace: settings['download-dir-free-space'] as number,
      blocklistEnabled: (settings['blocklist-enabled'] as boolean) ?? false,
      blocklistUrl: (settings['blocklist-url'] as string) ?? '',
      blocklistSize: (settings['blocklist-size'] as number) ?? 0,
      peerLimitGlobal: (settings['peer-limit-global'] as number) ?? 200,
      peerLimitPerTorrent: (settings['peer-limit-per-torrent'] as number) ?? 50,
      seedRatioLimit: (settings['seedRatioLimit'] as number) ?? 2.0,
      seedRatioLimited: (settings['seedRatioLimited'] as boolean) ?? false,
      idleSeedingLimit: (settings['idle-seeding-limit'] as number) ?? 30,
      idleSeedingLimitEnabled: (settings['idle-seeding-limit-enabled'] as boolean) ?? false,
      peerPort: (settings['peer-port'] as number) ?? 51413,
      portForwardingEnabled: (settings['port-forwarding-enabled'] as boolean) ?? false,
      encryption: (settings['encryption'] as string) ?? 'preferred',
      dhtEnabled: (settings['dht-enabled'] as boolean) ?? true,
      pexEnabled: (settings['pex-enabled'] as boolean) ?? true,
      lpdEnabled: (settings['lpd-enabled'] as boolean) ?? true,
      utpEnabled: (settings['utp-enabled'] as boolean) ?? true,
    };
  };
}

export default SettingsService;
