import React, { ChangeEvent } from 'react';
import TorrentName from '../TorrentName';
import ProgressBar from '../ProgressBar';
import type { Torrent } from '../../types/stores';

export interface TorrentColumnCtx {
  torrent: Torrent;
  handleSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  handleStart: () => void;
  handleStop: () => void;
  isStarting: boolean;
  isStopping: boolean;
}

type ColumnRenderer = (ctx: TorrentColumnCtx, width: number) => React.ReactNode;

const torrentColumnRenderers: Record<string, ColumnRenderer> = {
  checkbox: ({ torrent, handleSelect }) => (
    <td key="checkbox" className="checkbox">
      <input
        checked={torrent.selected}
        onChange={handleSelect}
        type="checkbox"
        aria-label={torrent.name}
      />
    </td>
  ),

  name: ({ torrent }, width) => (
    <td key="name" className="name">
      <TorrentName name={torrent.name} width={width} />
    </td>
  ),

  order: ({ torrent }) => {
    let value: number | string = torrent.order ?? 0;
    if (!Number.isFinite(value)) {
      value = '*';
    }
    return (
      <td key="order" className="order">
        <div>{value}</div>
      </td>
    );
  },

  size: ({ torrent }) => (
    <td key="size" className="size">
      <div title={torrent.sizeStr}>{torrent.sizeStr}</div>
    </td>
  ),

  remaining: ({ torrent }) => (
    <td key="remaining" className="remaining">
      <div>{torrent.remainingStr}</div>
    </td>
  ),

  done: ({ torrent }) => {
    const progressClass = torrent.isSeeding ? 'seeding' : 'downloading';
    return (
      <td key="done" className="done">
        <ProgressBar progressStr={torrent.progressStr} progressClass={progressClass} />
      </td>
    );
  },

  status: ({ torrent }) => {
    let errorIcon: React.ReactNode = null;
    const errorMessage = torrent.errorMessage;
    if (errorMessage) {
      errorIcon = (
        <i className="error_icon" title={errorMessage} role="img" aria-label={errorMessage} />
      );
    }
    return (
      <td key="status" className="status">
        <div title={torrent.stateText}>
          {errorIcon}
          {torrent.stateText}
        </div>
      </td>
    );
  },

  seeds: ({ torrent }) => (
    <td key="seeds" className="seeds">
      <div>{torrent.seeds}</div>
    </td>
  ),

  peers: ({ torrent }) => (
    <td key="peers" className="peers">
      <div>{torrent.peers}</div>
    </td>
  ),

  seeds_peers: ({ torrent }) => (
    <td key="seeds_peers" className="seeds_peers">
      <div>
        {torrent.activePeers} / {torrent.activeSeeds}
      </div>
    </td>
  ),

  downspd: ({ torrent }) => (
    <td key="downspd" className="downspd">
      <div>{torrent.downloadSpeedStr}</div>
    </td>
  ),

  upspd: ({ torrent }) => (
    <td key="upspd" className="upspd">
      <div>{torrent.uploadSpeedStr}</div>
    </td>
  ),

  eta: ({ torrent }) => (
    <td key="eta" className="eta">
      <div title={torrent.etaStr}>{torrent.etaStr}</div>
    </td>
  ),

  upped: ({ torrent }) => (
    <td key="upped" className="upped">
      <div>{torrent.uploadedStr}</div>
    </td>
  ),

  downloaded: ({ torrent }) => (
    <td key="downloaded" className="downloaded">
      <div>{torrent.downloadedStr}</div>
    </td>
  ),

  shared: ({ torrent }) => (
    <td key="shared" className="shared">
      <div>{torrent.shared / 1000}</div>
    </td>
  ),

  added: ({ torrent }) => (
    <td key="added" className="added">
      <div title={torrent.addedTimeStr}>{torrent.addedTimeStr}</div>
    </td>
  ),

  completed: ({ torrent }) => (
    <td key="completed" className="completed">
      <div title={torrent.completedTimeStr}>{torrent.completedTimeStr}</div>
    </td>
  ),

  actions: ({ handleStart, handleStop, isStarting, isStopping }) => (
    <td key="actions" className="actions">
      <div className="btns">
        <button
          onClick={handleStart}
          title={chrome.i18n.getMessage('ML_START')}
          aria-label={chrome.i18n.getMessage('ML_START')}
          className={`start${isStarting ? ' btn-loading' : ''}`}
          type="button"
          disabled={isStarting}
        />
        <button
          onClick={handleStop}
          title={chrome.i18n.getMessage('ML_STOP')}
          aria-label={chrome.i18n.getMessage('ML_STOP')}
          className={`stop${isStopping ? ' btn-loading' : ''}`}
          type="button"
          disabled={isStopping}
        />
      </div>
    </td>
  ),
};

export default torrentColumnRenderers;
