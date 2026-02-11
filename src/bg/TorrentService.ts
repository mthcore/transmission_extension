import getLogger from '../tools/getLogger';
import readBlobAsArrayBuffer from '../tools/readBlobAsArrayBuffer';
import { arrayBufferToBase64 } from '../tools/binaryConversion';
import downloadFileFromUrl from '../tools/downloadFileFromUrl';
import { RECENTLY_ACTIVE_THRESHOLD } from '../constants';
import type TransmissionTransport from './TransmissionTransport';
import type { TransmissionResponse } from './TransmissionTransport';
import type { Folder } from '../types/bg';

const logger = getLogger('TorrentService');

export interface NormalizedTorrent {
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

interface TorrentStore {
  activeTorrentIds: number[];
  torrentIds: number[];
  removeTorrentByIds: (ids: number[]) => void;
  syncChanges: (torrents: NormalizedTorrent[]) => void;
  sync: (torrents: NormalizedTorrent[]) => void;
  torrents: Map<number, { stateText: string }>;
  currentSpeed: { downloadSpeed: number; uploadSpeed: number };
  speedRoll: { add: (download: number, upload: number) => void };
}

interface TorrentNotifier {
  torrentCompleteNotify: (torrent: { stateText: string }) => void;
  torrentAddedNotify: (torrent: { id: number; name?: string }) => void;
  torrentIsExistsNotify: (torrent: { id: number; name?: string }) => void;
  torrentErrorNotify: (message: string) => void;
}

interface TorrentServiceOptions {
  transport: TransmissionTransport;
  clientStore: TorrentStore;
  notifier: TorrentNotifier;
  getShowNotifications: () => boolean;
}

class TorrentService {
  private transport: TransmissionTransport;
  private clientStore: TorrentStore;
  private notifier: TorrentNotifier;
  private getShowNotifications: () => boolean;
  private torrentsResponseTime: number;
  private _notifiedIdsPromise: Promise<number[] | null>;

  constructor(options: TorrentServiceOptions) {
    this.transport = options.transport;
    this.clientStore = options.clientStore;
    this.notifier = options.notifier;
    this.getShowNotifications = options.getShowNotifications;
    this.torrentsResponseTime = 0;

    this._notifiedIdsPromise = chrome.storage.local
      .get('_notifiedIds')
      .then((data) => (data._notifiedIds as number[] | undefined) ?? null);
    chrome.storage.local.remove('_activeIds');
  }

  resetResponseTime(): void {
    this.torrentsResponseTime = 0;
  }

  private thenUpdateTorrents = <T>(result: T): Promise<T> => {
    return this.updateTorrents().then(() => result);
  };

  updateTorrents(force?: boolean): Promise<TransmissionResponse> {
    const now = Math.trunc(Date.now() / 1000);

    let isRecently = false;
    if (!force && now - this.torrentsResponseTime < RECENTLY_ACTIVE_THRESHOLD) {
      isRecently = true;
    }

    const requestPromise = this.transport.sendAction(
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

    return Promise.all([requestPromise, this._notifiedIdsPromise]).then(
      ([response, previousNotifiedIds]) => {
        this.torrentsResponseTime = now;

        if (isRecently) {
          const { removed, torrents } = response.arguments as {
            removed: number[];
            torrents: Record<string, unknown>[];
          };

          this.clientStore.removeTorrentByIds(removed);
          this.clientStore.syncChanges(torrents.map(this.normalizeTorrent));
        } else {
          const { torrents } = response.arguments as { torrents: Record<string, unknown>[] };
          this.clientStore.sync(torrents.map(this.normalizeTorrent));
        }

        // Completion detection via persisted notified set
        const activeSet = new Set(this.clientStore.activeTorrentIds);
        const completedIds = this.clientStore.torrentIds.filter((id) => !activeSet.has(id));

        if (this.getShowNotifications() && previousNotifiedIds !== null) {
          const notifiedSet = new Set(previousNotifiedIds);
          for (const id of completedIds) {
            if (!notifiedSet.has(id)) {
              const torrent = this.clientStore.torrents.get(id);
              if (torrent) {
                this.notifier.torrentCompleteNotify(torrent);
              }
            }
          }
        }

        this._notifiedIdsPromise = Promise.resolve(completedIds);
        chrome.storage.local.set({ _notifiedIds: completedIds });

        const { downloadSpeed, uploadSpeed } = this.clientStore.currentSpeed;
        this.clientStore.speedRoll.add(downloadSpeed, uploadSpeed);

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

  start(ids: number[]): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'torrent-start', arguments: { ids } })
      .then(this.thenUpdateTorrents);
  }

  forcestart(ids: number[]): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'torrent-start-now', arguments: { ids } })
      .then(this.thenUpdateTorrents);
  }

  stop(ids: number[]): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'torrent-stop', arguments: { ids } })
      .then(this.thenUpdateTorrents);
  }

  recheck(ids: number[]): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'torrent-verify', arguments: { ids } })
      .then(this.thenUpdateTorrents);
  }

  removetorrent(ids: number[]): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'torrent-remove', arguments: { ids } })
      .then(this.thenUpdateTorrents);
  }

  removedatatorrent(ids: number[]): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'torrent-remove', arguments: { ids, 'delete-local-data': true } })
      .then(this.thenUpdateTorrents);
  }

  rename(ids: number[], path: string, name: string): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'torrent-rename-path', arguments: { ids, path, name } })
      .then(this.thenUpdateTorrents);
  }

  torrentSetLocation(ids: number[], location: string): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'torrent-set-location', arguments: { ids, location, move: true } })
      .then(this.thenUpdateTorrents);
  }

  reannounce(ids: number[]): Promise<TransmissionResponse> {
    return this.transport.sendAction({ method: 'torrent-reannounce', arguments: { ids } });
  }

  queueTop(ids: number[]): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'queue-move-top', arguments: { ids } })
      .then(this.thenUpdateTorrents);
  }

  queueUp(ids: number[]): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'queue-move-up', arguments: { ids } })
      .then(this.thenUpdateTorrents);
  }

  queueDown(ids: number[]): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'queue-move-down', arguments: { ids } })
      .then(this.thenUpdateTorrents);
  }

  queueBottom(ids: number[]): Promise<TransmissionResponse> {
    return this.transport
      .sendAction({ method: 'queue-move-bottom', arguments: { ids } })
      .then(this.thenUpdateTorrents);
  }

  sendFile(data: { blob?: Blob; url?: string }, directory?: Folder): Promise<TransmissionResponse> {
    const transport = this.transport;
    return Promise.resolve()
      .then(() => {
        if (data.url) {
          return transport.sendAction(
            putDirectory({
              method: 'torrent-add',
              arguments: { filename: data.url },
            })
          );
        } else if (data.blob) {
          return readBlobAsArrayBuffer(data.blob)
            .then((ab) => arrayBufferToBase64(ab))
            .then((base64) => {
              return transport.sendAction(
                putDirectory({
                  method: 'torrent-add',
                  arguments: { metainfo: base64 },
                })
              );
            });
        } else {
          throw new Error('No URL or blob provided');
        }
      })
      .catch((err) => {
        if (err.code === 'TRANSMISSION_ERROR') {
          this.notifier.torrentErrorNotify(err.message);
        } else {
          this.notifier.torrentErrorNotify(chrome.i18n.getMessage('unexpectedError'));
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
          this.notifier.torrentAddedNotify(torrentAdded);
        }
        if (torrentDuplicate) {
          this.notifier.torrentIsExistsNotify(torrentDuplicate);
        }
      },
      (err) => {
        if (err.code === 'TRANSMISSION_ERROR') {
          this.notifier.torrentErrorNotify(err.message);
        } else {
          this.notifier.torrentErrorNotify(chrome.i18n.getMessage('unexpectedError'));
        }
        throw err;
      }
    );
  }

  sendFiles(urls: string[], directory?: Folder): Promise<TransmissionResponse> {
    return Promise.all(
      urls.map((url) => {
        return downloadFileFromUrl(url)
          .catch((err) => {
            if (err.code === 'FILE_SIZE_EXCEEDED') {
              this.notifier.torrentErrorNotify(chrome.i18n.getMessage('fileSizeError'));
              throw err;
            }
            if (!/^https?:/.test(url)) {
              this.notifier.torrentErrorNotify(chrome.i18n.getMessage('unexpectedError'));
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

  private normalizeTorrent = (torrent: Record<string, unknown>): NormalizedTorrent => {
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
}

export default TorrentService;
