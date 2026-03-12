/**
 * Transmission RPC API Types
 * Based on the official RPC spec: https://github.com/transmission/transmission/blob/main/docs/rpc-spec.md
 */

// Torrent status codes: 0=stopped, 1=check wait, 2=check, 3=download wait, 4=download, 5=seed wait, 6=seed
export type TorrentStatusCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Priority levels for files: 0=don't download, 1=low, 2=normal, 3=high
export type FilePriorityLevel = 0 | 1 | 2 | 3;

// Bandwidth priority: -1=low, 0=normal, 1=high
export type BandwidthPriority = -1 | 0 | 1;

// Raw torrent data from Transmission API (torrent-get fields)
export interface RawTorrent {
  id: number;
  name: string;
  hashString: string;
  totalSize: number;
  percentDone: number;
  percentComplete?: number;
  downloadedEver: number;
  uploadedEver: number;
  rateUpload: number;
  rateDownload: number;
  eta: number;
  etaIdle?: number;
  peersSendingToUs: number;
  peersGettingFromUs: number;
  peersConnected: number;
  queuePosition?: number;
  addedDate: number;
  doneDate: number;
  startDate?: number;
  activityDate?: number;
  editDate?: number;
  downloadDir: string;
  recheckProgress: number;
  status: TorrentStatusCode;
  error: number;
  errorString: string;
  trackerStats?: TrackerStats[];
  magnetLink?: string;
  uploadRatio: number;
  isFinished?: boolean;
  isStalled?: boolean;
  isPrivate?: boolean;
  labels?: string[];
  bandwidthPriority?: BandwidthPriority;
  // Size & data fields
  sizeWhenDone?: number;
  leftUntilDone?: number;
  desiredAvailable?: number;
  haveValid?: number;
  haveUnchecked?: number;
  corruptEver?: number;
  metadataPercentComplete?: number;
  // Per-torrent limits
  downloadLimit?: number;
  downloadLimited?: boolean;
  uploadLimit?: number;
  uploadLimited?: boolean;
  honorsSessionLimits?: boolean;
  peerLimit?: number;
  maxConnectedPeers?: number;
  // Seeding limits
  seedIdleLimit?: number;
  seedIdleMode?: number;
  seedRatioLimit?: number;
  seedRatioMode?: number;
  // Timing
  secondsDownloading?: number;
  secondsSeeding?: number;
  // Metadata
  comment?: string;
  creator?: string;
  dateCreated?: number;
  pieceCount?: number;
  pieceSize?: number;
  torrentFile?: string;
  // Files & pieces
  files?: RawFile[];
  fileStats?: RawFileStats[];
  pieces?: string;
  wanted?: boolean[];
  priorities?: number[];
  // Peers
  peers?: RawPeer[];
  peersFrom?: PeersFrom;
  // Trackers
  trackers?: RawTracker[];
  trackerList?: string;
  // v4.0.0+ fields
  fileCount?: number;
  primaryMimeType?: string;
  availability?: number[];
  group?: string;
  // v4.1.0+ fields
  sequentialDownload?: boolean;
  // Web seeds
  webseeds?: string[];
}

export interface TrackerStats {
  id: number;
  announce: string;
  scrape: string;
  tier: number;
  host?: string;
  sitename?: string;
  isBackup: boolean;
  announceState: number;
  scrapeState: number;
  lastAnnounceResult: string;
  lastAnnounceSucceeded: boolean;
  lastAnnounceTime: number;
  lastAnnounceStartTime: number;
  lastAnnounceTimedOut: boolean;
  lastAnnouncePeerCount: number;
  lastScrapeResult: string;
  lastScrapeSucceeded: boolean;
  lastScrapeTime: number;
  lastScrapeStartTime: number;
  lastScrapeTimedOut: boolean;
  nextAnnounceTime: number;
  nextScrapeTime: number;
  seederCount: number;
  leecherCount: number;
  downloadCount: number;
  downloaderCount?: number;
}

export interface RawTracker {
  id: number;
  announce: string;
  scrape: string;
  tier: number;
  sitename?: string;
}

export interface RawPeer {
  address: string;
  clientName: string;
  flagStr: string;
  isDownloadingFrom: boolean;
  isEncrypted: boolean;
  isIncoming: boolean;
  isUploadingTo: boolean;
  isUTP: boolean;
  peerIsChoked: boolean;
  peerIsInterested: boolean;
  clientIsChoked: boolean;
  clientIsInterested: boolean;
  port: number;
  progress: number;
  rateToClient: number;
  rateToPeer: number;
}

export interface PeersFrom {
  fromCache: number;
  fromDht: number;
  fromIncoming: number;
  fromLpd: number;
  fromLtep: number;
  fromPex: number;
  fromTracker: number;
}

// Raw file data from Transmission API
export interface RawFile {
  name: string;
  length: number;
  bytesCompleted: number;
  beginPiece?: number;
  endPiece?: number;
}

export interface RawFileStats {
  priority: FilePriorityLevel;
  wanted: boolean;
  bytesCompleted: number;
}

// torrent-add request arguments
export interface TorrentAddArgs {
  filename?: string;
  metainfo?: string;
  'download-dir'?: string;
  paused?: boolean;
  cookies?: string;
  'peer-limit'?: number;
  'bandwidth-priority'?: BandwidthPriority;
  'files-wanted'?: number[];
  'files-unwanted'?: number[];
  'priority-high'?: number[];
  'priority-low'?: number[];
  'priority-normal'?: number[];
  labels?: string[];
  // v4.1.0+
  'sequential-download'?: boolean;
}

// torrent-set request arguments
export interface TorrentSetArgs {
  ids: number[] | 'recently-active';
  bandwidthPriority?: BandwidthPriority;
  downloadLimit?: number;
  downloadLimited?: boolean;
  'files-unwanted'?: number[];
  'files-wanted'?: number[];
  group?: string;
  honorsSessionLimits?: boolean;
  labels?: string[];
  location?: string;
  'peer-limit'?: number;
  'priority-high'?: number[];
  'priority-low'?: number[];
  'priority-normal'?: number[];
  queuePosition?: number;
  seedIdleLimit?: number;
  seedIdleMode?: number;
  seedRatioLimit?: number;
  seedRatioMode?: number;
  trackerList?: string;
  uploadLimit?: number;
  uploadLimited?: boolean;
  // v4.1.0+
  sequentialDownload?: boolean;
}

// Transmission session settings (session-get response)
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
  'rpc-version-semver'?: string;
  'script-torrent-done-enabled': boolean;
  'script-torrent-done-filename': string;
  'script-torrent-added-enabled'?: boolean;
  'script-torrent-added-filename'?: string;
  'script-torrent-done-seeding-enabled'?: boolean;
  'script-torrent-done-seeding-filename'?: string;
  'seed-queue-enabled': boolean;
  'seed-queue-size': number;
  seedRatioLimit: number;
  seedRatioLimited: boolean;
  'session-id'?: string;
  'speed-limit-down': number;
  'speed-limit-down-enabled': boolean;
  'speed-limit-up': number;
  'speed-limit-up-enabled': boolean;
  'start-added-torrents': boolean;
  'trash-original-torrent-files': boolean;
  'default-trackers'?: string;
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

// session-stats response
export interface SessionStatsResponse {
  activeTorrentCount: number;
  downloadSpeed: number;
  pausedTorrentCount: number;
  torrentCount: number;
  uploadSpeed: number;
  'cumulative-stats': SessionStatistics;
  'current-stats': SessionStatistics;
}

export interface SessionStatistics {
  uploadedBytes: number;
  downloadedBytes: number;
  filesAdded: number;
  sessionCount: number;
  secondsActive: number;
}

// Bandwidth group (v4.0.0+)
export interface BandwidthGroup {
  name: string;
  honorsSessionLimits: boolean;
  'speed-limit-down': number;
  'speed-limit-down-enabled': boolean;
  'speed-limit-up': number;
  'speed-limit-up-enabled': boolean;
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
  'total-size'?: number;
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
