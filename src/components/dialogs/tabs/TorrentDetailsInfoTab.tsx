import React from 'react';
import { speedToStr, formatBytes } from '../../../tools/format';
import type { PeerData, TorrentDetailData } from '../../../bg/TorrentService';
import type { MouseEvent } from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
}

interface Torrent {
  sizeStr: string;
  progressStr: string;
  downloadedStr: string;
  uploadedStr: string;
  downloaded: number;
  uploaded: number;
  activeSeeds: number;
  seeds: number;
  activePeers: number;
  peers: number;
  downloadSpeedStr: string;
  uploadSpeedStr: string;
  etaStr: string;
  stateText: string;
  addedTimeStr: string;
  completedTimeStr: string;
  directory?: string;
  errorMessage?: string;
  hash?: string | null;
  peersConnected?: number;
}

interface TorrentDetailsInfoTabProps {
  torrent: Torrent;
  details: TorrentDetailData | null;
  detailsLoading: boolean;
  peers: PeerData[];
  peersLoading: boolean;
  peerWidths: Record<string, number>;
  getPeerResizeProps: (key: string) => ResizeHandleProps;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.length > 0 ? parts.join(' ') : '< 1m';
}

function formatDate(timestamp: number): string {
  if (timestamp <= 0) return '-';
  return new Date(timestamp * 1000).toLocaleDateString();
}

const TorrentDetailsInfoTab = ({
  torrent,
  details,
  detailsLoading,
  peers,
  peersLoading,
  peerWidths,
  getPeerResizeProps,
}: TorrentDetailsInfoTabProps) => {
  const ratio =
    torrent.downloaded > 0
      ? (torrent.uploaded / torrent.downloaded).toFixed(3)
      : torrent.uploaded > 0
        ? '∞'
        : '0.000';

  return (
    <>
      <div className="torrent-details-grid">
        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_SIZE')}</label>
          <span>{torrent.sizeStr}</span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_DONE')}</label>
          <span>{torrent.progressStr}</span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_DOWNLOADED')}</label>
          <span>{torrent.downloadedStr}</span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_UPPED')}</label>
          <span>{torrent.uploadedStr}</span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_SHARED')}</label>
          <span>{ratio}</span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_SEEDS')}</label>
          <span>
            {torrent.activeSeeds} / {torrent.seeds}
          </span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_PEERS')}</label>
          <span>
            {torrent.activePeers} / {torrent.peers}
            {torrent.peersConnected != null && ` (${torrent.peersConnected})`}
          </span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_DOWNSPD')}</label>
          <span>{torrent.downloadSpeedStr || '-'}</span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_UPSPD')}</label>
          <span>{torrent.uploadSpeedStr || '-'}</span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_ETA')}</label>
          <span>{torrent.etaStr}</span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_STATUS')}</label>
          <span>{torrent.stateText}</span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_DATE_ADDED')}</label>
          <span>{torrent.addedTimeStr}</span>
        </div>

        <div className="nf-subItem">
          <label>{chrome.i18n.getMessage('OV_COL_DATE_COMPLETED')}</label>
          <span>{torrent.completedTimeStr}</span>
        </div>

        {details && (
          <>
            {details.creator && (
              <div className="nf-subItem">
                <label>{chrome.i18n.getMessage('DT_CREATOR')}</label>
                <span>{details.creator}</span>
              </div>
            )}

            {details.dateCreated > 0 && (
              <div className="nf-subItem">
                <label>{chrome.i18n.getMessage('DT_DATE_CREATED')}</label>
                <span>{formatDate(details.dateCreated)}</span>
              </div>
            )}

            {details.pieceCount > 0 && (
              <div className="nf-subItem">
                <label>{chrome.i18n.getMessage('DT_PIECES')}</label>
                <span>
                  {details.pieceCount} × {formatBytes(details.pieceSize)}
                </span>
              </div>
            )}

            {details.corruptEver > 0 && (
              <div className="nf-subItem">
                <label>{chrome.i18n.getMessage('DT_CORRUPT')}</label>
                <span>{formatBytes(details.corruptEver)}</span>
              </div>
            )}

            {details.secondsDownloading > 0 && (
              <div className="nf-subItem">
                <label>{chrome.i18n.getMessage('DT_TIME_DOWNLOADING')}</label>
                <span>{formatDuration(details.secondsDownloading)}</span>
              </div>
            )}

            {details.secondsSeeding > 0 && (
              <div className="nf-subItem">
                <label>{chrome.i18n.getMessage('DT_TIME_SEEDING')}</label>
                <span>{formatDuration(details.secondsSeeding)}</span>
              </div>
            )}

            {details.comment && (
              <div className="nf-subItem torrent-details-full-width">
                <label>{chrome.i18n.getMessage('DT_COMMENT')}</label>
                <span>{details.comment}</span>
              </div>
            )}

            {details.webseeds.length > 0 && (
              <div className="nf-subItem torrent-details-full-width">
                <label>{chrome.i18n.getMessage('DT_WEBSEEDS')}</label>
                <span>{details.webseeds.join(', ')}</span>
              </div>
            )}
          </>
        )}

        {torrent.hash && (
          <div className="nf-subItem torrent-details-full-width">
            <label>{chrome.i18n.getMessage('copyHash')}</label>
            <span className="torrent-details-path">{torrent.hash}</span>
          </div>
        )}

        {torrent.directory && (
          <div className="nf-subItem torrent-details-full-width">
            <label>{chrome.i18n.getMessage('path')}</label>
            <span className="torrent-details-path">{torrent.directory}</span>
          </div>
        )}

        {torrent.errorMessage && (
          <div className="nf-subItem torrent-details-full-width torrent-details-error">
            <label>{chrome.i18n.getMessage('OV_FL_ERROR')}</label>
            <span>{torrent.errorMessage}</span>
          </div>
        )}
      </div>

      {peers.length > 0 && (
        <div className="torrent-details-peers">
          <div className="torrent-details-peers-header">
            {chrome.i18n.getMessage('OV_COL_PEERS')} ({peers.length})
          </div>
          <div className="peer-list-scroll">
            <table className="peer-list-table">
              <colgroup>
                <col style={{ width: peerWidths.ip }} />
                <col style={{ width: peerWidths.client }} />
                <col style={{ width: peerWidths.pct }} />
                <col style={{ width: peerWidths.dl }} />
                <col style={{ width: peerWidths.ul }} />
                <col style={{ width: peerWidths.flags }} />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <div>{chrome.i18n.getMessage('PRS_COL_IP')}</div>
                    <div className="resize-el" {...getPeerResizeProps('ip')} />
                  </th>
                  <th>
                    <div>Client</div>
                    <div className="resize-el" {...getPeerResizeProps('client')} />
                  </th>
                  <th>
                    <div>%</div>
                    <div className="resize-el" {...getPeerResizeProps('pct')} />
                  </th>
                  <th>
                    <div>{chrome.i18n.getMessage('OV_COL_DOWNSPD')}</div>
                    <div className="resize-el" {...getPeerResizeProps('dl')} />
                  </th>
                  <th>
                    <div>{chrome.i18n.getMessage('OV_COL_UPSPD')}</div>
                    <div className="resize-el" {...getPeerResizeProps('ul')} />
                  </th>
                  <th>
                    <div>{chrome.i18n.getMessage('peerFlags')}</div>
                    <div className="resize-el" {...getPeerResizeProps('flags')} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {peers.map((peer) => (
                  <tr key={peer.address}>
                    <td title={peer.address}>{peer.address}</td>
                    <td title={peer.client}>{peer.client}</td>
                    <td>{(peer.progress * 100).toFixed(0)}%</td>
                    <td>{peer.downloadSpeed ? speedToStr(peer.downloadSpeed) : '-'}</td>
                    <td>{peer.uploadSpeed ? speedToStr(peer.uploadSpeed) : '-'}</td>
                    <td className="peer-flags" title={peer.flags}>
                      {peer.flags}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {peersLoading && peers.length === 0 && (
        <div className="torrent-details-peers">
          <div className="torrent-details-peers-header">
            {chrome.i18n.getMessage('OV_COL_PEERS')}...
          </div>
        </div>
      )}

      {detailsLoading && !details && (
        <div className="torrent-details-peers">
          <div className="torrent-details-peers-header">Loading...</div>
        </div>
      )}
    </>
  );
};

export default TorrentDetailsInfoTab;
