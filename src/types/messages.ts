/**
 * Background Script Message Types
 *
 * Discriminated union for all message types sent to the background script.
 * Each action has its own interface with required properties.
 */

import type { TorrentId } from './index';

// Directory configuration for adding torrents
export interface DirectoryConfig {
  name?: string;
  path: string;
}

// Discriminated union of all message types
export type BgMessage =
  // Store sync messages
  | GetBgStoreDeltaMessage
  | GetConfigStoreMessage
  // Torrent list updates
  | UpdateTorrentListMessage
  // Torrent actions (bulk)
  | TorrentActionMessage
  // Queue management
  | QueueActionMessage
  // File operations
  | SetPriorityMessage
  | GetFileListMessage
  // Speed settings
  | SpeedLimitEnabledMessage
  | SpeedLimitMessage
  | AltSpeedEnabledMessage
  | AltSpeedLimitMessage
  // Session operations
  | UpdateSettingsMessage
  | SendFilesMessage
  | GetFreeSpaceMessage
  // Torrent modifications
  | RenameMessage
  | TorrentSetLocationMessage;

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

// Torrent actions that operate on IDs
type TorrentAction =
  | 'start'
  | 'forcestart'
  | 'stop'
  | 'recheck'
  | 'removetorrent'
  | 'removedatatorrent'
  | 'reannounce';

export interface TorrentActionMessage {
  action: TorrentAction;
  ids: TorrentId[];
}

// Queue management
type QueueAction = 'queueTop' | 'queueUp' | 'queueDown' | 'queueBottom';

export interface QueueActionMessage {
  action: QueueAction;
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

// Speed limit settings
type SpeedLimitEnabledAction =
  | 'setDownloadSpeedLimitEnabled'
  | 'setUploadSpeedLimitEnabled';

export interface SpeedLimitEnabledMessage {
  action: SpeedLimitEnabledAction;
  enabled: boolean;
}

type SpeedLimitAction = 'setDownloadSpeedLimit' | 'setUploadSpeedLimit';

export interface SpeedLimitMessage {
  action: SpeedLimitAction;
  speed: number;
}

export interface AltSpeedEnabledMessage {
  action: 'setAltSpeedEnabled';
  enabled: boolean;
}

type AltSpeedLimitAction = 'setAltUploadSpeedLimit' | 'setAltDownloadSpeedLimit';

export interface AltSpeedLimitMessage {
  action: AltSpeedLimitAction;
  speed: number;
}

// Session operations
export interface UpdateSettingsMessage {
  action: 'updateSettings';
}

export interface SendFilesMessage {
  action: 'sendFiles';
  urls: string[];
  directory?: DirectoryConfig;
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
