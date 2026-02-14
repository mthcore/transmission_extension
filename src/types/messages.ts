/**
 * Background Script Message Types
 *
 * Discriminated union for all message types sent to the background script.
 * Each action has its own interface with required properties.
 */

import type { TorrentId } from './index';
import type { Folder } from './bg';

// Discriminated union of all message types
export type BgMessage =
  // Store sync messages
  | GetBgStoreDeltaMessage
  | GetConfigStoreMessage
  // Torrent list updates
  | UpdateTorrentListMessage
  // Torrent & queue actions (bulk by IDs)
  | IdActionMessage
  // File operations
  | SetPriorityMessage
  | GetFileListMessage
  | GetPeersMessage
  // Speed settings
  | SpeedEnabledMessage
  | SpeedValueMessage
  // Blocklist operations
  | BlocklistUrlMessage
  | BlocklistUpdateMessage
  // Session operations
  | UpdateSettingsMessage
  | SendFilesMessage
  | GetFreeSpaceMessage
  // Torrent modifications
  | RenameMessage
  | TorrentSetLocationMessage
  | SetLabelsMessage
  | SetBandwidthPriorityMessage
  | SessionNumberMessage
  | EncryptionMessage
  | IncompleteDirMessage
  | ScriptTorrentDoneFilenameMessage
  | PortTestMessage
  | GetTorrentDetailsMessage
  | SetTrackerListMessage
  | SetSeedLimitsMessage;

// Store sync messages
export interface GetBgStoreDeltaMessage {
  action: 'getBgStoreDelta';
  id: number;
  patchId: number | null;
}

export interface GetConfigStoreMessage {
  action: 'getConfigStore';
}

// Torrent list updates
export interface UpdateTorrentListMessage {
  action: 'updateTorrentList';
  force?: boolean;
}

// Torrent & queue actions that operate on IDs
type IdAction =
  | 'start'
  | 'forcestart'
  | 'stop'
  | 'recheck'
  | 'removetorrent'
  | 'removedatatorrent'
  | 'reannounce'
  | 'queueTop'
  | 'queueUp'
  | 'queueDown'
  | 'queueBottom';

export interface IdActionMessage {
  action: IdAction;
  ids: TorrentId[];
}

// File operations
export interface SetPriorityMessage {
  action: 'setPriority';
  id: TorrentId;
  level: number;
  fileIdxs: number[];
}

export interface GetFileListMessage {
  action: 'getFileList';
  id: TorrentId;
}

export interface GetPeersMessage {
  action: 'getPeers';
  id: TorrentId;
}

// Speed settings
type SpeedEnabledAction =
  | 'setDownloadSpeedLimitEnabled'
  | 'setUploadSpeedLimitEnabled'
  | 'setAltSpeedEnabled'
  | 'setBlocklistEnabled'
  | 'setSeedRatioLimited'
  | 'setIdleSeedingLimitEnabled'
  | 'setPortForwardingEnabled'
  | 'setDhtEnabled'
  | 'setPexEnabled'
  | 'setLpdEnabled'
  | 'setUtpEnabled'
  | 'setIncompleteDirEnabled'
  | 'setRenamePartialFiles'
  | 'setDownloadQueueEnabled'
  | 'setSeedQueueEnabled'
  | 'setQueueStalledEnabled'
  | 'setStartAddedTorrents'
  | 'setTrashOriginalTorrentFiles'
  | 'setAltSpeedTimeEnabled'
  | 'setScriptTorrentDoneEnabled';

export interface SpeedEnabledMessage {
  action: SpeedEnabledAction;
  enabled: boolean;
}

type SpeedValueAction =
  | 'setDownloadSpeedLimit'
  | 'setUploadSpeedLimit'
  | 'setAltUploadSpeedLimit'
  | 'setAltDownloadSpeedLimit';

export interface SpeedValueMessage {
  action: SpeedValueAction;
  speed: number;
}

type SessionNumberAction =
  | 'setPeerLimitGlobal'
  | 'setPeerLimitPerTorrent'
  | 'setSeedRatioLimit'
  | 'setIdleSeedingLimit'
  | 'setPeerPort'
  | 'setDownloadQueueSize'
  | 'setSeedQueueSize'
  | 'setQueueStalledMinutes'
  | 'setAltSpeedTimeBegin'
  | 'setAltSpeedTimeEnd'
  | 'setAltSpeedTimeDay';

export interface SessionNumberMessage {
  action: SessionNumberAction;
  value: number;
}

export interface EncryptionMessage {
  action: 'setEncryption';
  mode: string;
}

// Session operations
export interface UpdateSettingsMessage {
  action: 'updateSettings';
}

export interface SendFilesMessage {
  action: 'sendFiles';
  urls: string[];
  directory?: Folder;
}

export interface GetFreeSpaceMessage {
  action: 'getFreeSpace';
  path: string;
}

// Torrent modifications
export interface RenameMessage {
  action: 'rename';
  ids: TorrentId[];
  path: string;
  name: string;
}

export interface TorrentSetLocationMessage {
  action: 'torrentSetLocation';
  ids: TorrentId[];
  location: string;
}

export interface SetLabelsMessage {
  action: 'setLabels';
  ids: TorrentId[];
  labels: string[];
}

export interface SetBandwidthPriorityMessage {
  action: 'setBandwidthPriority';
  ids: TorrentId[];
  priority: number;
}

// Blocklist operations
export interface BlocklistUrlMessage {
  action: 'setBlocklistUrl';
  url: string;
}

export interface BlocklistUpdateMessage {
  action: 'blocklistUpdate';
}

// Incomplete dir
export interface IncompleteDirMessage {
  action: 'setIncompleteDir';
  dir: string;
}

// Script on completion
export interface ScriptTorrentDoneFilenameMessage {
  action: 'setScriptTorrentDoneFilename';
  filename: string;
}

// Port test
export interface PortTestMessage {
  action: 'portTest';
}

// Torrent details (on-demand)
export interface GetTorrentDetailsMessage {
  action: 'getTorrentDetails';
  id: TorrentId;
}

// Tracker list
export interface SetTrackerListMessage {
  action: 'setTrackerList';
  ids: TorrentId[];
  trackerList: string;
}

// Per-torrent seed limits
export interface SetSeedLimitsMessage {
  action: 'setSeedLimits';
  ids: TorrentId[];
  seedRatioMode: number;
  seedRatioLimit: number;
  seedIdleMode: number;
  seedIdleLimit: number;
}
