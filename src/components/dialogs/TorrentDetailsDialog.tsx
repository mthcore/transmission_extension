import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react';
import Dialog from './Dialog';
import { useDialogClose } from '../../hooks/useDialogClose';
import useRootStore from '../../hooks/useRootStore';
import { useResizableColumns } from '../../hooks/useResizableColumns';
import { speedToStr, formatBytes } from '../../tools/format';

interface PeerInfo {
  address: string;
  client: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  flags: string;
}

interface TrackerStat {
  id: number;
  announce: string;
  tier: number;
  seederCount: number;
  leecherCount: number;
  lastAnnounceResult: string;
  isBackup: boolean;
}

interface TorrentDetailData {
  comment: string;
  creator: string;
  dateCreated: number;
  pieceCount: number;
  pieceSize: number;
  corruptEver: number;
  desiredAvailable: number;
  secondsDownloading: number;
  secondsSeeding: number;
  webseeds: string[];
  trackerList: string;
  trackerStats: TrackerStat[];
  seedRatioLimit: number;
  seedRatioMode: number;
  seedIdleLimit: number;
  seedIdleMode: number;
}

interface RootStore {
  client: {
    getPeers: (id: number) => Promise<PeerInfo[]>;
    getTorrentDetails: (id: number) => Promise<TorrentDetailData>;
    setTrackerList: (ids: number[], trackerList: string) => Promise<unknown>;
    setSeedLimits: (
      ids: number[],
      seedRatioMode: number,
      seedRatioLimit: number,
      seedIdleMode: number,
      seedIdleLimit: number
    ) => Promise<unknown>;
  };
  config: {
    detailPeerWidths: Record<string, number>;
    detailTrackerWidths: Record<string, number>;
    setDetailPeerWidths: (widths: Record<string, number>) => void;
    setDetailTrackerWidths: (widths: Record<string, number>) => void;
  };
}

interface Torrent {
  id: number;
  name: string;
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

interface TorrentDetailsDialogStore {
  close: () => void;
  torrent: Torrent | null;
}

interface TorrentDetailsDialogProps {
  dialogStore: TorrentDetailsDialogStore;
}

type TabId = 'info' | 'trackers' | 'seedLimits';

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

function trackerHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const TorrentDetailsDialog = observer(({ dialogStore }: TorrentDetailsDialogProps) => {
  const torrent = dialogStore.torrent;
  const handleClose = useDialogClose(dialogStore);
  const rootStore = useRootStore() as unknown as RootStore;
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [details, setDetails] = useState<TorrentDetailData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Tracker edit state
  const [trackerListText, setTrackerListText] = useState('');
  const [trackerSaving, setTrackerSaving] = useState(false);

  // Seed limits state
  const [seedRatioMode, setSeedRatioMode] = useState(0);
  const [seedRatioLimit, setSeedRatioLimit] = useState(0);
  const [seedIdleMode, setSeedIdleMode] = useState(0);
  const [seedIdleLimit, setSeedIdleLimit] = useState(0);
  const [seedSaving, setSeedSaving] = useState(false);

  // Resizable columns
  const defaultPeerWidths = useMemo(
    () => ({ ip: 100, client: 90, pct: 38, dl: 70, ul: 70, flags: 55 }),
    []
  );
  const defaultTrackerWidths = useMemo(
    () => ({ url: 160, tier: 40, seeds: 50, peers: 50, status: 80 }),
    []
  );
  const peerResize = useResizableColumns({
    defaultWidths: defaultPeerWidths,
    savedWidths: rootStore.config.detailPeerWidths,
    onSave: (w) => rootStore.config.setDetailPeerWidths(w),
  });
  const trackerResize = useResizableColumns({
    defaultWidths: defaultTrackerWidths,
    savedWidths: rootStore.config.detailTrackerWidths,
    onSave: (w) => rootStore.config.setDetailTrackerWidths(w),
  });

  const torrentId = torrent?.id;

  useEffect(() => {
    if (torrentId == null) return;
    setPeersLoading(true);
    rootStore.client.getPeers(torrentId).then(
      (data) => {
        setPeers(data);
        setPeersLoading(false);
      },
      () => setPeersLoading(false)
    );
  }, [torrentId, rootStore.client]);

  useEffect(() => {
    if (torrentId == null) return;
    setDetailsLoading(true);
    rootStore.client.getTorrentDetails(torrentId).then(
      (data) => {
        setDetails(data);
        setTrackerListText(data.trackerList);
        setSeedRatioMode(data.seedRatioMode);
        setSeedRatioLimit(data.seedRatioLimit);
        setSeedIdleMode(data.seedIdleMode);
        setSeedIdleLimit(data.seedIdleLimit);
        setDetailsLoading(false);
      },
      () => setDetailsLoading(false)
    );
  }, [torrentId, rootStore.client]);

  const handleApplyTrackers = useCallback(() => {
    if (torrentId == null) return;
    setTrackerSaving(true);
    rootStore.client.setTrackerList([torrentId], trackerListText).then(
      () => setTrackerSaving(false),
      () => setTrackerSaving(false)
    );
  }, [torrentId, trackerListText, rootStore.client]);

  const handleApplySeedLimits = useCallback(() => {
    if (torrentId == null) return;
    setSeedSaving(true);
    rootStore.client
      .setSeedLimits([torrentId], seedRatioMode, seedRatioLimit, seedIdleMode, seedIdleLimit)
      .then(
        () => setSeedSaving(false),
        () => setSeedSaving(false)
      );
  }, [torrentId, seedRatioMode, seedRatioLimit, seedIdleMode, seedIdleLimit, rootStore.client]);

  if (!torrent) {
    return null;
  }

  const ratio =
    torrent.downloaded > 0
      ? (torrent.uploaded / torrent.downloaded).toFixed(3)
      : torrent.uploaded > 0
        ? '∞'
        : '0.000';

  return (
    <Dialog onClose={handleClose} className="torrent-details-dialog">
      <div className="nf-notifi">
        <div className="nf-subItem torrent-details-header">
          <strong>{torrent.name}</strong>
        </div>

        <div className="torrent-details-tabs">
          <button
            className={activeTab === 'info' ? 'active' : ''}
            onClick={() => setActiveTab('info')}
          >
            {chrome.i18n.getMessage('DT_TAB_INFO')}
          </button>
          <button
            className={activeTab === 'trackers' ? 'active' : ''}
            onClick={() => setActiveTab('trackers')}
          >
            {chrome.i18n.getMessage('DT_TAB_TRACKERS')}
          </button>
          <button
            className={activeTab === 'seedLimits' ? 'active' : ''}
            onClick={() => setActiveTab('seedLimits')}
          >
            {chrome.i18n.getMessage('DT_TAB_SEED_LIMITS')}
          </button>
        </div>

        <div className="torrent-details-content">
          {activeTab === 'info' && (
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
                        <col style={{ width: peerResize.widths.ip }} />
                        <col style={{ width: peerResize.widths.client }} />
                        <col style={{ width: peerResize.widths.pct }} />
                        <col style={{ width: peerResize.widths.dl }} />
                        <col style={{ width: peerResize.widths.ul }} />
                        <col style={{ width: peerResize.widths.flags }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>
                            <div>{chrome.i18n.getMessage('PRS_COL_IP')}</div>
                            <div className="resize-el" {...peerResize.getResizeProps('ip')} />
                          </th>
                          <th>
                            <div>Client</div>
                            <div className="resize-el" {...peerResize.getResizeProps('client')} />
                          </th>
                          <th>
                            <div>%</div>
                            <div className="resize-el" {...peerResize.getResizeProps('pct')} />
                          </th>
                          <th>
                            <div>{chrome.i18n.getMessage('OV_COL_DOWNSPD')}</div>
                            <div className="resize-el" {...peerResize.getResizeProps('dl')} />
                          </th>
                          <th>
                            <div>{chrome.i18n.getMessage('OV_COL_UPSPD')}</div>
                            <div className="resize-el" {...peerResize.getResizeProps('ul')} />
                          </th>
                          <th>
                            <div>{chrome.i18n.getMessage('peerFlags')}</div>
                            <div className="resize-el" {...peerResize.getResizeProps('flags')} />
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
          )}

          {activeTab === 'trackers' && (
            <div className="tracker-scroll">
              {details && details.trackerStats.length > 0 && (
                <table className="tracker-list-table">
                  <colgroup>
                    <col style={{ width: trackerResize.widths.url }} />
                    <col style={{ width: trackerResize.widths.tier }} />
                    <col style={{ width: trackerResize.widths.seeds }} />
                    <col style={{ width: trackerResize.widths.peers }} />
                    <col style={{ width: trackerResize.widths.status }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>
                        <div>{chrome.i18n.getMessage('DT_TRACKER_URL')}</div>
                        <div className="resize-el" {...trackerResize.getResizeProps('url')} />
                      </th>
                      <th>
                        <div>{chrome.i18n.getMessage('DT_TRACKER_TIER')}</div>
                        <div className="resize-el" {...trackerResize.getResizeProps('tier')} />
                      </th>
                      <th>
                        <div>{chrome.i18n.getMessage('DT_TRACKER_SEEDS')}</div>
                        <div className="resize-el" {...trackerResize.getResizeProps('seeds')} />
                      </th>
                      <th>
                        <div>{chrome.i18n.getMessage('DT_TRACKER_PEERS')}</div>
                        <div className="resize-el" {...trackerResize.getResizeProps('peers')} />
                      </th>
                      <th>
                        <div>{chrome.i18n.getMessage('DT_TRACKER_STATUS')}</div>
                        <div className="resize-el" {...trackerResize.getResizeProps('status')} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.trackerStats.map((ts) => (
                      <tr key={ts.id} className={ts.isBackup ? 'tracker-backup' : ''}>
                        <td title={ts.announce}>{trackerHostname(ts.announce)}</td>
                        <td>{ts.tier}</td>
                        <td>{ts.seederCount >= 0 ? ts.seederCount : '-'}</td>
                        <td>{ts.leecherCount >= 0 ? ts.leecherCount : '-'}</td>
                        <td>{ts.lastAnnounceResult || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {detailsLoading && !details && (
                <div className="torrent-details-peers-header">Loading...</div>
              )}

              {details && (
                <div className="tracker-list-edit">
                  <label>{chrome.i18n.getMessage('DT_TRACKER_LIST')}</label>
                  <div className="tracker-list-help">
                    {chrome.i18n.getMessage('DT_TRACKER_LIST_HELP')}
                  </div>
                  <textarea
                    className="tracker-list-textarea"
                    value={trackerListText}
                    onChange={(e) => setTrackerListText(e.target.value)}
                  />
                  <div className="torrent-details-buttons">
                    <button onClick={handleApplyTrackers} disabled={trackerSaving}>
                      {chrome.i18n.getMessage('DT_APPLY')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seedLimits' && (
            <div className="seed-limits-scroll">
              {details ? (
                <div className="seed-limits-form">
                  <div className="seed-limit-row">
                    <label>{chrome.i18n.getMessage('DT_SEED_RATIO_MODE')}</label>
                    <select
                      value={seedRatioMode}
                      onChange={(e) => setSeedRatioMode(Number(e.target.value))}
                    >
                      <option value={0}>{chrome.i18n.getMessage('DT_USE_GLOBAL')}</option>
                      <option value={1}>{chrome.i18n.getMessage('DT_CUSTOM')}</option>
                      <option value={2}>{chrome.i18n.getMessage('DT_UNLIMITED')}</option>
                    </select>
                  </div>

                  {seedRatioMode === 1 && (
                    <div className="seed-limit-row">
                      <label>{chrome.i18n.getMessage('DT_SEED_RATIO_LIMIT')}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={seedRatioLimit}
                        onChange={(e) => setSeedRatioLimit(Number(e.target.value))}
                      />
                    </div>
                  )}

                  <div className="seed-limit-row">
                    <label>{chrome.i18n.getMessage('DT_SEED_IDLE_MODE')}</label>
                    <select
                      value={seedIdleMode}
                      onChange={(e) => setSeedIdleMode(Number(e.target.value))}
                    >
                      <option value={0}>{chrome.i18n.getMessage('DT_USE_GLOBAL')}</option>
                      <option value={1}>{chrome.i18n.getMessage('DT_CUSTOM')}</option>
                      <option value={2}>{chrome.i18n.getMessage('DT_UNLIMITED')}</option>
                    </select>
                  </div>

                  {seedIdleMode === 1 && (
                    <div className="seed-limit-row">
                      <label>{chrome.i18n.getMessage('DT_SEED_IDLE_LIMIT')}</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={seedIdleLimit}
                        onChange={(e) => setSeedIdleLimit(Number(e.target.value))}
                      />
                    </div>
                  )}

                  <div className="torrent-details-buttons">
                    <button onClick={handleApplySeedLimits} disabled={seedSaving}>
                      {chrome.i18n.getMessage('DT_APPLY')}
                    </button>
                  </div>
                </div>
              ) : detailsLoading ? (
                <div className="torrent-details-peers-header">Loading...</div>
              ) : null}
            </div>
          )}
        </div>

        <div className="nf-subItem">
          <input
            onClick={handleClose}
            type="button"
            value={chrome.i18n.getMessage('DLG_BTN_CLOSE')}
          />
        </div>
      </div>
    </Dialog>
  );
});

export default TorrentDetailsDialog;
