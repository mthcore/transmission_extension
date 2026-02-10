import getLogger from '../tools/getLogger';
import ErrorWithCode from '../tools/ErrorWithCode';
import readBlobAsArrayBuffer from '../tools/readBlobAsArrayBuffer';
import arrayBufferToBase64 from '../tools/arrayBufferToBase64';
import splitByPart from '../tools/splitByPart';
import downloadFileFromUrl from '../tools/downloadFileFromUrl';

const logger = getLogger('TransmissionClient');

interface Folder {
  name?: string;
  path: string;
}

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

interface NormalizedTorrent {
  id: number;
  statusCode: number;
  errorCode: number;
  errorString: string;
  name: string;
  size: number;
  percentDone: number;
  recheckProgress: number;
  downloaded: number;
  uploaded: number;
  shared: number;
  uploadSpeed: number;
  downloadSpeed: number;
  eta: number;
  activePeers: number;
  peers: number;
  activeSeeds: number;
  seeds: number;
  order: number;
  addedTime: number;
  completedTime: number;
  directory: string;
  magnetLink: string;
}

interface NormalizedFile {
  name: string;
  shortName: string;
  size: number;
  downloaded: number;
  priority: number;
}

interface NormalizedSettings {
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

interface TransmissionResponse {
  result: string;
  arguments: Record<string, unknown>;
}

interface ErrorWithToken extends Error {
  code: string;
  status?: number;
  statusText?: string;
  token?: string;
}

class TransmissionClient {
  bg: Bg;
  torrentsResponseTime: number;
  token: string | null;
  url: string;
  private _notifiedIdsPromise: Promise<number[] | null>;

  constructor(bg: Bg) {
    this.bg = bg;

    this.torrentsResponseTime = 0;
    this.token = null;
    this.url = this.bgStore.config.url;

    // Load notified completion IDs for detection across SW restarts.
    // null = never initialized (first run); [] = initialized but empty.
    this._notifiedIdsPromise = chrome.storage.local
      .get('_notifiedIds')
      .then((data) => (data._notifiedIds as number[] | undefined) ?? null);
    chrome.storage.local.remove('_activeIds');
  }

  get bgStore(): BgStore {
    return this.bg.bgStore;
  }

  thenUpdateTorrents = <T>(result: T): Promise<T> => {
    return this.updateTorrents().then(() => result);
  };

  updateTorrents(force?: boolean): Promise<TransmissionResponse> {
    const now = Math.trunc(Date.now() / 1000);

    let isRecently = false;
    if (!force && now - this.torrentsResponseTime < 60) {
      isRecently = true;
    }

    const requestPromise = this.sendAction(
      {
        method: 'torrent-get',
        arguments: {
          fields: [
            'id',
            'name',
            'totalSize',
            'percentDone',
            'downloadedEver',
            'uploadedEver',
            'rateUpload',
            'rateDownload',
            'eta',
            'peersSendingToUs',
            'peersGettingFromUs',
            'queuePosition',
            'addedDate',
            'doneDate',
            'downloadDir',
            'recheckProgress',
            'status',
            'error',
            'errorString',
            'trackerStats',
            'magnetLink',
          ],
          ids: isRecently ? 'recently-active' : undefined,
        },
      },
      safeParser
    );

    // Load notified IDs in parallel with the HTTP request
    return Promise.all([requestPromise, this._notifiedIdsPromise]).then(
      ([response, previousNotifiedIds]) => {
        this.torrentsResponseTime = now;

        if (isRecently) {
          const { removed, torrents } = response.arguments as {
            removed: number[];
            torrents: Record<string, unknown>[];
          };

          this.bgStore.client.removeTorrentByIds(removed);

          this.bgStore.client.syncChanges(torrents.map(this.normalizeTorrent));
        } else {
          const { torrents } = response.arguments as { torrents: Record<string, unknown>[] };

          this.bgStore.client.sync(torrents.map(this.normalizeTorrent));
        }

        // Completion detection via persisted notified set
        const activeSet = new Set(this.bgStore.client.activeTorrentIds);
        const completedIds = this.bgStore.client.torrentIds.filter((id) => !activeSet.has(id));

        if (
          this.bgStore.config.showDownloadCompleteNotifications &&
          previousNotifiedIds !== null
        ) {
          const notifiedSet = new Set(previousNotifiedIds);
          for (const id of completedIds) {
            if (!notifiedSet.has(id)) {
              const torrent = this.bgStore.client.torrents.get(id);
              if (torrent) {
                this.bg.torrentCompleteNotify(torrent);
              }
            }
          }
        }

        this._notifiedIdsPromise = Promise.resolve(completedIds);
        chrome.storage.local.set({ _notifiedIds: completedIds });

        const { downloadSpeed, uploadSpeed } = this.bgStore.client.currentSpeed;
        this.bgStore.client.speedRoll.add(downloadSpeed, uploadSpeed);

        return response;
      }
    );

    function safeParser(text: string): TransmissionResponse {
      try {
        return JSON.parse(text);
      } catch {
        return JSON.parse(
          text.replace(
            /"(announce|scrape|lastAnnounceResult|lastScrapeResult)":"([^"]+)"/g,
            safeValue
          )
        );
      }
    }

    function safeValue(_match: string, key: string, value: string): string {
      try {
        JSON.parse(`"${value}"`);
      } catch {
        value = encodeURIComponent(value);
      }
      return `"${key}":"${value}"`;
    }
  }

  getFileList(id: number): Promise<NormalizedFile[]> {
    return this.sendAction({
      method: 'torrent-get',
      arguments: {
        fields: ['id', 'files', 'fileStats'],
        ids: [id],
      },
    }).then((response) => {
      let files: NormalizedFile[] | null = null;
      type TorrentFiles = {
        id: number;
        files: Array<{ name: string; length: number; bytesCompleted: number }>;
        fileStats: Array<{ wanted: boolean; priority: number }>;
      };
      const torrents = (response.arguments as { torrents: TorrentFiles[] }).torrents;
      torrents.some((torrent) => {
        if (torrent.id === id) {
          files = this.normalizeFiles(torrent);
          return true;
        }
        return false;
      });

      if (!files) {
        throw new ErrorWithCode("Files don't received");
      }
      return files;
    });
  }

  thenUpdateSettings = <T>(result: T): Promise<T> => {
    return this.updateSettings().then(() => result);
  };

  // Version that returns void for methods that don't need the result
  thenUpdateSettingsVoid = (): Promise<void> => {
    return this.updateSettings();
  };

  updateSettings(): Promise<void> {
    return this.sendAction({ method: 'session-get' }).then((response) => {
      this.bgStore.client.setSettings(
        this.normalizeSettings(response.arguments as Record<string, unknown>)
      );
    });
  }

  getFreeSpace(path: string): Promise<{ path: string; sizeBytes: number }> {
    return this.sendAction({
      method: 'free-space',
      arguments: { path },
    }).then((response) => {
      const args = response.arguments as { path: string; 'size-bytes': number };
      return {
        path: args.path,
        sizeBytes: args['size-bytes'],
      };
    });
  }

  sendAction(
    body: Record<string, unknown>,
    customParser?: (text: string) => TransmissionResponse
  ): Promise<TransmissionResponse> {
    return this.retryIfTokenInvalid(() => {
      return fetch(
        this.url,
        this.sign({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Transmission-Session-Id': this.token || '',
          },
          body: JSON.stringify(body),
        })
      ).then((response) => {
        if (!response.ok) {
          const error = new ErrorWithCode(
            `${response.status}: ${response.statusText}`,
            `RESPONSE_IS_NOT_OK`
          ) as ErrorWithToken;
          error.status = response.status;
          error.statusText = response.statusText;
          if (error.status === 409) {
            error.token = response.headers.get('X-Transmission-Session-Id') || undefined;
            error.code = 'INVALID_TOKEN';
          }
          throw error;
        }

        if (!this.bg.daemon.isActive) {
          this.bg.daemon.start();
        }

        if (customParser) {
          return response.text().then((text) => customParser(text));
        } else {
          return response.json() as Promise<TransmissionResponse>;
        }
      });
    }).then((response) => {
      if (response.result !== 'success') {
        throw new ErrorWithCode(response.result, 'TRANSMISSION_ERROR');
      }

      return response;
    });
  }

  sendFile(data: { blob?: Blob; url?: string }, directory?: Folder): Promise<TransmissionResponse> {
    return Promise.resolve()
      .then(() => {
        if (data.url) {
          return this.sendAction(
            putDirectory({
              method: 'torrent-add',
              arguments: {
                filename: data.url,
              },
            })
          );
        } else if (data.blob) {
          return readBlobAsArrayBuffer(data.blob)
            .then((ab) => arrayBufferToBase64(ab))
            .then((base64) => {
              return this.sendAction(
                putDirectory({
                  method: 'torrent-add',
                  arguments: {
                    metainfo: base64,
                  },
                })
              );
            });
        } else {
          throw new Error('No URL or blob provided');
        }
      })
      .catch((err) => {
        if (err.code === 'TRANSMISSION_ERROR') {
          this.bg.torrentErrorNotify(err.message);
        } else {
          this.bg.torrentErrorNotify(chrome.i18n.getMessage('unexpectedError'));
        }
        throw err;
      });

    function putDirectory(query: { method: string; arguments: Record<string, unknown> }): {
      method: string;
      arguments: Record<string, unknown>;
    } {
      if (directory) {
        query.arguments['download-dir'] = directory.path;
      }
      return query;
    }
  }

  putTorrent(data: { blob?: Blob; url?: string }, directory?: Folder): Promise<void> {
    return this.sendFile(data, directory).then(
      (response) => {
        const args = response.arguments as {
          'torrent-added'?: { id: number; name: string };
          'torrent-duplicate'?: { id: number; name: string };
        };
        const torrentAdded = args['torrent-added'];
        const torrentDuplicate = args['torrent-duplicate'];
        if (torrentAdded) {
          this.bg.torrentAddedNotify(torrentAdded);
        }

        if (torrentDuplicate) {
          this.bg.torrentIsExistsNotify(torrentDuplicate);
        }
      },
      (err) => {
        if (err.code === 'TRANSMISSION_ERROR') {
          this.bg.torrentErrorNotify(err.message);
        } else {
          this.bg.torrentErrorNotify(chrome.i18n.getMessage('unexpectedError'));
        }
        throw err;
      }
    );
  }

  start(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'torrent-start',
      arguments: {
        ids,
      },
    }).then(this.thenUpdateTorrents);
  }

  forcestart(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'torrent-start-now',
      arguments: {
        ids,
      },
    }).then(this.thenUpdateTorrents);
  }

  stop(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'torrent-stop',
      arguments: {
        ids,
      },
    }).then(this.thenUpdateTorrents);
  }

  recheck(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'torrent-verify',
      arguments: {
        ids,
      },
    }).then(this.thenUpdateTorrents);
  }

  removetorrent(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'torrent-remove',
      arguments: {
        ids,
      },
    }).then(this.thenUpdateTorrents);
  }

  removedatatorrent(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'torrent-remove',
      arguments: {
        ids,
        'delete-local-data': true,
      },
    }).then(this.thenUpdateTorrents);
  }

  rename(ids: number[], path: string, name: string): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'torrent-rename-path',
      arguments: { ids, path, name },
    }).then(this.thenUpdateTorrents);
  }

  torrentSetLocation(ids: number[], location: string): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'torrent-set-location',
      arguments: {
        ids,
        location,
        move: true,
      },
    }).then(this.thenUpdateTorrents);
  }

  reannounce(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'torrent-reannounce',
      arguments: { ids },
    });
  }

  queueTop(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'queue-move-top',
      arguments: { ids },
    }).then(this.thenUpdateTorrents);
  }

  queueUp(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'queue-move-up',
      arguments: { ids },
    }).then(this.thenUpdateTorrents);
  }

  queueDown(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'queue-move-down',
      arguments: { ids },
    }).then(this.thenUpdateTorrents);
  }

  queueBottom(ids: number[]): Promise<TransmissionResponse> {
    return this.sendAction({
      method: 'queue-move-bottom',
      arguments: { ids },
    }).then(this.thenUpdateTorrents);
  }

  setPriority(id: number, level: number, idxs: number[]): Promise<unknown[]> {
    return Promise.all(
      splitByPart(idxs, 250).map((partIdxs) => {
        const args: Record<string, unknown> = {
          ids: [id],
        };

        if (level === 0) {
          args['files-unwanted'] = partIdxs;
        } else {
          args['files-wanted'] = partIdxs;
          switch (level) {
            case 1: {
              args['priority-low'] = partIdxs;
              break;
            }
            case 2: {
              args['priority-normal'] = partIdxs;
              break;
            }
            case 3: {
              args['priority-high'] = partIdxs;
              break;
            }
          }
        }

        return this.sendAction({
          method: 'torrent-set',
          arguments: args,
        });
      })
    );
  }

  // Speed limit methods - factorized using helper
  private setSessionSetting(args: Record<string, unknown>): Promise<void> {
    return this.sendAction({
      method: 'session-set',
      arguments: args,
    }).then(this.thenUpdateSettingsVoid);
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

  sendFiles(urls: string[], directory?: Folder): Promise<TransmissionResponse> {
    return Promise.all(
      urls.map((url) => {
        return downloadFileFromUrl(url)
          .catch((err) => {
            if (err.code === 'FILE_SIZE_EXCEEDED') {
              this.bg.torrentErrorNotify(chrome.i18n.getMessage('fileSizeError'));
              throw err;
            }
            if (!/^https?:/.test(url)) {
              this.bg.torrentErrorNotify(chrome.i18n.getMessage('unexpectedError'));
              throw err;
            }
            if (err.code !== 'LINK_IS_NOT_SUPPORTED') {
              logger.error('sendFiles: downloadFileFromUrl error, fallback to url', err);
            }
            return { url };
          })
          .then((data) => {
            return this.putTorrent(data, directory);
          })
          .then(
            () => {
              return { result: true };
            },
            (err) => {
              logger.error('sendFile error', url, err);
              return { error: err };
            }
          );
      })
    ).then(() => this.thenUpdateTorrents({} as TransmissionResponse));
  }

  retryIfTokenInvalid<T>(callback: () => Promise<T>): Promise<T> {
    return Promise.resolve(callback()).catch((err: ErrorWithToken) => {
      if (err.code === 'INVALID_TOKEN') {
        this.token = err.token || null;
        this.torrentsResponseTime = 0;
        return callback();
      }
      throw err;
    });
  }

  sign(fetchOptions: RequestInit): RequestInit {
    if (this.bgStore.config.authenticationRequired) {
      if (!fetchOptions.headers) {
        fetchOptions.headers = {};
      }
      (fetchOptions.headers as Record<string, string>).Authorization =
        'Basic ' + btoa([this.bgStore.config.login, this.bgStore.config.password].join(':'));
    }
    return fetchOptions;
  }

  normalizeTorrent = (torrent: Record<string, unknown>): NormalizedTorrent => {
    const id = torrent.id as number;

    const statusCode = torrent.status as number;
    const errorCode = torrent.error as number;
    const errorString = torrent.errorString as string;
    const name = torrent.name as string;
    const size = torrent.totalSize as number;
    const percentDone = torrent.percentDone as number;
    const recheckProgress = torrent.recheckProgress as number;
    const downloaded = torrent.downloadedEver as number;
    const uploaded = torrent.uploadedEver as number;
    const shared = downloaded > 0 ? Math.round((uploaded / downloaded) * 1000) : 0;
    const uploadSpeed = torrent.rateUpload as number;
    const downloadSpeed = torrent.rateDownload as number;
    const eta = (torrent.eta as number) < 0 ? 0 : (torrent.eta as number);

    let _peers = 0;
    let _seeds = 0;
    const trackerStats = torrent.trackerStats as
      | Array<{ leecherCount: number; seederCount: number }>
      | undefined;
    if (Array.isArray(trackerStats)) {
      trackerStats.forEach((tracker) => {
        if (tracker.leecherCount > 0) {
          _peers += tracker.leecherCount;
        }
        if (tracker.seederCount > 0) {
          _seeds += tracker.seederCount;
        }
      });
    }

    const activePeers = torrent.peersGettingFromUs as number;
    const peers = _peers;
    const activeSeeds = torrent.peersSendingToUs as number;
    const seeds = _seeds;

    const order = torrent.queuePosition as number;
    const addedTime = torrent.addedDate as number;
    const completedTime = torrent.doneDate as number;
    const directory = torrent.downloadDir as string;
    const magnetLink = torrent.magnetLink as string;

    return {
      id,
      statusCode,
      errorCode,
      errorString,
      name,
      size,
      percentDone,
      recheckProgress,
      downloaded,
      uploaded,
      shared,
      uploadSpeed,
      downloadSpeed,
      eta,
      activePeers,
      peers,
      activeSeeds,
      seeds,
      order,
      addedTime,
      completedTime,
      directory,
      magnetLink,
    };
  };

  normalizeFiles = (torrent: {
    files: Array<{ name: string; length: number; bytesCompleted: number }>;
    fileStats: Array<{ wanted: boolean; priority: number }>;
  }): NormalizedFile[] => {
    return torrent.files.map((file, index) => {
      const state = torrent.fileStats[index];

      const name = file.name;
      const shortName = name;
      const size = file.length;
      const downloaded = file.bytesCompleted;
      const priority = !state.wanted ? 0 : state.priority + 2;

      return { name, shortName, size, downloaded, priority };
    });
  };

  normalizeSettings = (settings: Record<string, unknown>): NormalizedSettings => {
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

  destroy(): void {
    // Cleanup
  }
}

export default TransmissionClient;
