import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import Dialog from './Dialog';
import { useDialogClose } from '../../hooks/useDialogClose';
import useRootStore from '../../hooks/useRootStore';
import { speedToStr } from '../../tools/format';

interface PeerInfo {
  address: string;
  client: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  flags: string;
}

interface RootStore {
  client: {
    getPeers: (id: number) => Promise<PeerInfo[]>;
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

const TorrentDetailsDialog = observer(({ dialogStore }: TorrentDetailsDialogProps) => {
  const torrent = dialogStore.torrent;
  const handleClose = useDialogClose(dialogStore);
  const rootStore = useRootStore() as unknown as RootStore;
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);

  const torrentId = torrent?.id;
  useEffect(() => {
    if (torrentId == null) return;
    setPeersLoading(true);
    rootStore.client.getPeers(torrentId).then(
      (data) => {
        setPeers(data);
        setPeersLoading(false);
      },
      () => {
        setPeersLoading(false);
      }
    );
  }, [torrentId, rootStore.client]);

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
                <thead>
                  <tr>
                    <th>{chrome.i18n.getMessage('PRS_COL_IP')}</th>
                    <th>Client</th>
                    <th>%</th>
                    <th>{chrome.i18n.getMessage('OV_COL_DOWNSPD')}</th>
                    <th>{chrome.i18n.getMessage('OV_COL_UPSPD')}</th>
                    <th>{chrome.i18n.getMessage('peerFlags')}</th>
                  </tr>
                </thead>
                <tbody>
                  {peers.map((peer) => (
                    <tr key={peer.address}>
                      <td title={peer.address}>{peer.address}</td>
                      <td className="peer-client" title={peer.client}>
                        {peer.client}
                      </td>
                      <td>{(peer.progress * 100).toFixed(0)}%</td>
                      <td>{peer.downloadSpeed ? speedToStr(peer.downloadSpeed) : '-'}</td>
                      <td>{peer.uploadSpeed ? speedToStr(peer.uploadSpeed) : '-'}</td>
                      <td className="peer-flags" title={peer.flags}>{peer.flags}</td>
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
