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
  // Speed settings
  | SpeedEnabledMessage
  | SpeedValueMessage
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

// Speed settings
type SpeedEnabledAction =
  | 'setDownloadSpeedLimitEnabled'
  | 'setUploadSpeedLimitEnabled'
  | 'setAltSpeedEnabled';

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
