/**
 * Transmission RPC API Types
 */

// Torrent status codes
export const TorrentStatus = {
  STOPPED: 0,
  CHECK_WAIT: 1,
  CHECK: 2,
  DOWNLOAD_WAIT: 3,
  DOWNLOAD: 4,
  SEED_WAIT: 5,
  SEED: 6,
} as const;

export type TorrentStatusCode = (typeof TorrentStatus)[keyof typeof TorrentStatus];

// Priority levels for files
export const FilePriority = {
  DONT_DOWNLOAD: 0,
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
} as const;

export type FilePriorityLevel = (typeof FilePriority)[keyof typeof FilePriority];

// Raw torrent data from Transmission API
export interface RawTorrent {
  id: number;
  name: string;
  totalSize: number;
  percentDone: number;
  downloadedEver: number;
  uploadedEver: number;
  rateUpload: number;
  rateDownload: number;
  eta: number;
  peersSendingToUs: number;
  peersGettingFromUs: number;
  queuePosition?: number;
  addedDate: number;
  doneDate: number;
  downloadDir: string;
  recheckProgress: number;
  status: TorrentStatusCode;
  error: number;
  errorString: string;
  trackerStats?: TrackerStats[];
  magnetLink?: string;
}

export interface TrackerStats {
  announce: string;
  scrape: string;
  lastAnnounceResult: string;
  lastScrapeResult: string;
  seederCount: number;
  leecherCount: number;
}

// Raw file data from Transmission API
export interface RawFile {
  name: string;
  length: number;
  bytesCompleted: number;
}

export interface RawFileStats {
  priority: FilePriorityLevel;
  wanted: boolean;
  bytesCompleted: number;
}

// Transmission session settings
export interface SessionSettings {
  'alt-speed-down': number;
  'alt-speed-enabled': boolean;
  'alt-speed-time-begin': number;
  'alt-speed-time-day': number;
  'alt-speed-time-enabled': boolean;
  'alt-speed-time-end': number;
  'alt-speed-up': number;
  'blocklist-enabled': boolean;
  'blocklist-size': number;
  'blocklist-url': string;
  'cache-size-mb': number;
  'config-dir': string;
  'dht-enabled': boolean;
  'download-dir': string;
  'download-dir-free-space': number;
  'download-queue-enabled': boolean;
  'download-queue-size': number;
  encryption: string;
  'idle-seeding-limit': number;
  'idle-seeding-limit-enabled': boolean;
  'incomplete-dir': string;
  'incomplete-dir-enabled': boolean;
  'lpd-enabled': boolean;
  'peer-limit-global': number;
  'peer-limit-per-torrent': number;
  'peer-port': number;
  'peer-port-random-on-start': boolean;
  'pex-enabled': boolean;
  'port-forwarding-enabled': boolean;
  'queue-stalled-enabled': boolean;
  'queue-stalled-minutes': number;
  'rename-partial-files': boolean;
  'rpc-version': number;
  'rpc-version-minimum': number;
  'script-torrent-done-enabled': boolean;
  'script-torrent-done-filename': string;
  'seed-queue-enabled': boolean;
  'seed-queue-size': number;
  seedRatioLimit: number;
  seedRatioLimited: boolean;
  'speed-limit-down': number;
  'speed-limit-down-enabled': boolean;
  'speed-limit-up': number;
  'speed-limit-up-enabled': boolean;
  'start-added-torrents': boolean;
  'trash-original-torrent-files': boolean;
  units: {
    'memory-bytes': number;
    'memory-units': string[];
    'size-bytes': number;
    'size-units': string[];
    'speed-bytes': number;
    'speed-units': string[];
  };
  'utp-enabled': boolean;
  version: string;
}

// RPC Request/Response types
export interface TransmissionRequest {
  method: string;
  arguments?: Record<string, unknown>;
  tag?: number;
}

export interface TransmissionResponse<T = unknown> {
  result: 'success' | string;
  arguments: T;
  tag?: number;
}

// Torrent-get response
export interface TorrentGetResponse {
  torrents: RawTorrent[];
  removed?: number[];
}

// Free space response
export interface FreeSpaceResponse {
  path: string;
  'size-bytes': number;
}

// Add torrent response
export interface AddTorrentResponse {
  'torrent-added'?: {
    id: number;
    name: string;
    hashString: string;
  };
  'torrent-duplicate'?: {
    id: number;
    name: string;
    hashString: string;
  };
}
