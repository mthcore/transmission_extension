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
    };
  };
}

export default SettingsService;
