import React, { MouseEvent } from "react";
import { observer } from "mobx-react";
import Dialog from "./Dialog";
import { useDialogClose } from "../hooks/useDialogClose";

interface Torrent {
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
}

interface TorrentDetailsDialogStore {
  close: () => void;
  torrent: Torrent | null;
}

interface TorrentDetailsDialogProps {
  dialogStore: TorrentDetailsDialogStore;
}

const TorrentDetailsDialog: React.FC<TorrentDetailsDialogProps> = observer(({ dialogStore }) => {
  const torrent = dialogStore.torrent;
  const handleClose = useDialogClose(dialogStore);

  if (!torrent) {
    return null;
  }

  const ratio = torrent.downloaded > 0
    ? (torrent.uploaded / torrent.downloaded).toFixed(3)
    : torrent.uploaded > 0 ? '∞' : '0.000';

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
            <span>{torrent.activeSeeds} / {torrent.seeds}</span>
          </div>

          <div className="nf-subItem">
            <label>{chrome.i18n.getMessage('OV_COL_PEERS')}</label>
            <span>{torrent.activePeers} / {torrent.peers}</span>
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

        <div className="nf-subItem">
          <input onClick={handleClose as unknown as (e: MouseEvent<HTMLInputElement>) => void} type="button" value={chrome.i18n.getMessage('DLG_BTN_CLOSE')}/>
        </div>
      </div>
    </Dialog>
  );
});

export default TorrentDetailsDialog;
