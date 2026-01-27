import {observer} from "mobx-react";
import React, {useContext, useCallback} from "react";
import PropTypes from "prop-types";
import RootStoreCtx from "../tools/RootStoreCtx";
import TorrentContextMenu from "./TorrentContextMenu";
import TorrentName from "./TorrentName";

const TorrentListTableItem = observer(({torrent}) => {
  const rootStore = useContext(RootStoreCtx);
  const torrentListStore = rootStore.torrentList;

  const handleSelect = useCallback((e) => {
    if (!torrent.selected) {
      if (e.nativeEvent.shiftKey) {
        torrentListStore.addMultipleSelectedId(torrent.id);
      } else {
        torrentListStore.addSelectedId(torrent.id);
      }
    } else {
      torrentListStore.removeSelectedId(torrent.id);
    }
  }, [torrent, torrentListStore]);

  const handleStart = useCallback((e) => {
    e.preventDefault();
    torrent.start();
  }, [torrent]);

  const handleStop = useCallback((e) => {
    e.preventDefault();
    torrent.stop();
  }, [torrent]);

  const handleDblClick = useCallback((e) => {
    e.preventDefault();
    rootStore.createFileList(torrent.id);
  }, [rootStore, torrent.id]);

  const visibleTorrentColumns = rootStore.config.visibleTorrentColumns;

  const columns = [];
  visibleTorrentColumns.forEach(({column: name, width}) => {
    switch (name) {
      case 'checkbox': {
        columns.push(
          <td key={name} className={name}>
            <input checked={torrent.selected} onChange={handleSelect} type="checkbox"/>
          </td>
        );
        break;
      }
      case 'name': {
        columns.push(
          <td key={name} className={name}>
            <TorrentName name={torrent.name} width={width}/>
          </td>
        );
        break;
      }
        case 'order': {
          let value = torrent.order;
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
        const lightWidth = progressNum > 0 ? `${10000 / progressNum}%` : '100%';

        columns.push(
          <td key={name} className={name}>
            <div className="progress_b">
              <div className="val">{torrent.progressStr}</div>
              <div style={{width: progressWidth}} className={`progress_b_i ${progressClass}`}>
                <div className="val-light" style={{width: lightWidth}}>{torrent.progressStr}</div>
              </div>
            </div>
          </td>
        );
        break;
      }
        case 'status': {
          let errorIcon = null;
          const errorMessage = torrent.errorMessage;
          if (errorMessage) {
            errorIcon = (
              <i className={'error_icon'} title={errorMessage}/>
            );
          }
          columns.push(
            <td key={name} className={name}>
              <div title={torrent.stateText}>{errorIcon}{torrent.stateText}</div>
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
              <div>{torrent.activePeers} / {torrent.activeSeeds}</div>
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
              <a onClick={handleStart} title={chrome.i18n.getMessage('ML_START')} aria-label={chrome.i18n.getMessage('ML_START')} className="start" href="#start"/>
              <a onClick={handleStop} title={chrome.i18n.getMessage('ML_STOP')} aria-label={chrome.i18n.getMessage('ML_STOP')} className="stop" href="#stop"/>
            </div>
          </td>
        );
        break;
      }
    }
  });

  const classList = [];
  if (torrent.selected) {
    classList.push('selected');
  }

  return (
    <TorrentContextMenu torrentId={torrent.id}>
      <tr className={classList.join(' ')} id={torrent.id} onDoubleClick={handleDblClick}>
        {columns}
      </tr>
    </TorrentContextMenu>
  );
});

TorrentListTableItem.propTypes = {
  torrent: PropTypes.object.isRequired,
};

export default TorrentListTableItem;