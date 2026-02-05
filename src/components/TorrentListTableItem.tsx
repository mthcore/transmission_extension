import { observer } from 'mobx-react';
import React, { useContext, useCallback, ChangeEvent } from 'react';
import RootStoreCtx from '../tools/rootStoreCtx';
import TorrentContextMenu from './TorrentContextMenu';
import TorrentName from './TorrentName';
import { PROGRESS_LIGHT_DENOMINATOR } from '../constants';
import { useLoading } from '../hooks/useLoading';

interface Torrent {
  id: number;
  name: string;
  selected: boolean;
  order: number;
  sizeStr: string;
  remainingStr: string;
  isSeeding: boolean;
  progressStr: string;
  errorMessage?: string;
  stateText: string;
  seeds: number;
  peers: number;
  activePeers: number;
  activeSeeds: number;
  downloadSpeedStr: string;
  uploadSpeedStr: string;
  etaStr: string;
  uploadedStr: string;
  downloadedStr: string;
  shared: number;
  addedTimeStr: string;
  completedTimeStr: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

interface TorrentListTableItemProps {
  torrent: Torrent;
}

interface TorrentListStore {
  addMultipleSelectedId: (id: number) => void;
  addSelectedId: (id: number) => void;
  removeSelectedId: (id: number) => void;
}

const TorrentListTableItem: React.FC<TorrentListTableItemProps> = observer(({ torrent }) => {
  const rootStore = useContext(RootStoreCtx);
  const torrentListStore = rootStore?.torrentList as TorrentListStore | undefined;
  const config = rootStore?.config;
  const { isLoading: isStarting, withLoading: withStartLoading } = useLoading();
  const { isLoading: isStopping, withLoading: withStopLoading } = useLoading();

  const handleSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!torrent.selected) {
        if (e.nativeEvent instanceof MouseEvent && (e.nativeEvent as MouseEvent).shiftKey) {
          torrentListStore?.addMultipleSelectedId(torrent.id);
        } else {
          torrentListStore?.addSelectedId(torrent.id);
        }
      } else {
        torrentListStore?.removeSelectedId(torrent.id);
      }
    },
    [torrent, torrentListStore]
  );

  const handleStart = useCallback(() => {
    withStartLoading(() => torrent.start());
  }, [torrent, withStartLoading]);

  const handleStop = useCallback(() => {
    withStopLoading(() => torrent.stop());
  }, [torrent, withStopLoading]);

  const handleDblClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => {
      e.preventDefault();
      rootStore?.createFileList(torrent.id);
    },
    [rootStore, torrent.id]
  );

  if (!rootStore || !config) return null;

  const visibleTorrentColumns = config.visibleTorrentColumns as unknown as Array<{
    column: string;
    width: number;
  }>;

  const columns: React.ReactNode[] = [];
  visibleTorrentColumns.forEach(({ column: name, width }) => {
    switch (name) {
      case 'checkbox': {
        columns.push(
          <td key={name} className={name}>
            <input checked={torrent.selected} onChange={handleSelect} type="checkbox" />
          </td>
        );
        break;
      }
      case 'name': {
        columns.push(
          <td key={name} className={name}>
            <TorrentName name={torrent.name} width={width} />
          </td>
        );
        break;
      }
      case 'order': {
        let value: number | string = torrent.order;
        if (!Number.isFinite(value)) {
          value = '*';
        }

        columns.push(
          <td key={name} className={name}>
            <div>{value}</div>
          </td>
        );
        break;
      }
      case 'size': {
        columns.push(
          <td key={name} className={name}>
            <div title={torrent.sizeStr}>{torrent.sizeStr}</div>
          </td>
        );
        break;
      }
      case 'remaining': {
        columns.push(
          <td key={name} className={name}>
            <div>{torrent.remainingStr}</div>
          </td>
        );
        break;
      }
      case 'done': {
        const progressClass = torrent.isSeeding ? 'seeding' : 'downloading';
        const progressWidth = torrent.progressStr;
        const progressNum = parseFloat(progressWidth) || 0;
        const lightWidth =
          progressNum > 0 ? `${PROGRESS_LIGHT_DENOMINATOR / progressNum}%` : '100%';

        columns.push(
          <td key={name} className={name}>
            <div className="progress_b">
              <div className="val">{torrent.progressStr}</div>
              <div style={{ width: progressWidth }} className={`progress_b_i ${progressClass}`}>
                <div className="val-light" style={{ width: lightWidth }}>
                  {torrent.progressStr}
                </div>
              </div>
            </div>
          </td>
        );
        break;
      }
      case 'status': {
        let errorIcon: React.ReactNode = null;
        const errorMessage = torrent.errorMessage;
        if (errorMessage) {
          errorIcon = <i className={'error_icon'} title={errorMessage} />;
        }
        columns.push(
          <td key={name} className={name}>
            <div title={torrent.stateText}>
              {errorIcon}
              {torrent.stateText}
            </div>
          </td>
        );
        break;
      }
      case 'seeds': {
        columns.push(
          <td key={name} className={name}>
            <div>{torrent.seeds}</div>
          </td>
        );
        break;
      }
      case 'peers': {
        columns.push(
          <td key={name} className={name}>
            <div>{torrent.peers}</div>
          </td>
        );
        break;
      }
      case 'seeds_peers': {
        columns.push(
          <td key={name} className={name}>
            <div>
              {torrent.activePeers} / {torrent.activeSeeds}
            </div>
          </td>
        );
        break;
      }
      case 'downspd': {
        columns.push(
          <td key={name} className={name}>
            <div>{torrent.downloadSpeedStr}</div>
          </td>
        );
        break;
      }
      case 'upspd': {
        columns.push(
          <td key={name} className={name}>
            <div>{torrent.uploadSpeedStr}</div>
          </td>
        );
        break;
      }
      case 'eta': {
        columns.push(
          <td key={name} className={name}>
            <div title={torrent.etaStr}>{torrent.etaStr}</div>
          </td>
        );
        break;
      }
      case 'upped': {
        columns.push(
          <td key={name} className={name}>
            <div>{torrent.uploadedStr}</div>
          </td>
        );
        break;
      }
      case 'downloaded': {
        columns.push(
          <td key={name} className={name}>
            <div>{torrent.downloadedStr}</div>
          </td>
        );
        break;
      }
      case 'shared': {
        columns.push(
          <td key={name} className={name}>
            <div>{torrent.shared / 1000}</div>
          </td>
        );
        break;
      }
      case 'added': {
        columns.push(
          <td key={name} className={name}>
            <div title={torrent.addedTimeStr}>{torrent.addedTimeStr}</div>
          </td>
        );
        break;
      }
      case 'completed': {
        columns.push(
          <td key={name} className={name}>
            <div title={torrent.completedTimeStr}>{torrent.completedTimeStr}</div>
          </td>
        );
        break;
      }
      case 'actions': {
        columns.push(
          <td key={name} className={name}>
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
        );
        break;
      }
    }
  });

  const classList: string[] = [];
  if (torrent.selected) {
    classList.push('selected');
  }

  return (
    <TorrentContextMenu torrentId={torrent.id}>
      <tr className={classList.join(' ')} id={String(torrent.id)} onDoubleClick={handleDblClick}>
        {columns}
      </tr>
    </TorrentContextMenu>
  );
});

export default TorrentListTableItem;
