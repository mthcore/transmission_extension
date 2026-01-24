import {observer} from "mobx-react";
import React from "react";
import PropTypes from "prop-types";
import RootStoreCtx from "../tools/RootStoreCtx";
import TorrentContextMenu from "./TorrentContextMenu";

@observer
class TorrentListTableItem extends React.PureComponent {
  static propTypes = {
    torrent: PropTypes.object.isRequired,
  };

  static contextType = RootStoreCtx;

  /**@return {RootStore}*/
  get rootStore() {
    return this.context;
  }

  /**@return {TorrentStore}*/
  get torrentStore() {
    return this.props.torrent;
  }

  /**@return {TorrentListStore}*/
  get torrentListStore() {
    return this.rootStore.torrentList;
  }

  handleSelect = (e) => {
    if (!this.torrentStore.selected) {
      if (e.nativeEvent.shiftKey) {
        this.torrentListStore.addMultipleSelectedId(this.torrentStore.id);
      } else {
        this.torrentListStore.addSelectedId(this.torrentStore.id);
      }
    } else {
      this.torrentListStore.removeSelectedId(this.torrentStore.id);
    }
  };

  handleStart = (e) => {
    e.preventDefault();
    this.torrentStore.start();
  };

  handleStop = (e) => {
    e.preventDefault();
    this.torrentStore.stop();
  };

  handleDblClick = (e) => {
    e.preventDefault();
    this.rootStore.createFileList(this.torrentStore.id);
  };

  render() {
    const torrent = this.torrentStore;
    const visibleTorrentColumns = this.rootStore.config.visibleTorrentColumns;

    const columns = [];
    visibleTorrentColumns.forEach(({column: name, width}) => {
      switch (name) {
        case 'checkbox': {
          columns.push(
            <td key={name} className={name}>
              <input checked={this.torrentStore.selected} onChange={this.handleSelect} type="checkbox"/>
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
          const width = torrent.progressStr;

          columns.push(
            <td key={name} className={name}>
              <div className="progress_b">
                <div className="val">{torrent.progressStr}</div>
                <div style={{width}} className={`progress_b_i ${progressClass}`}/>
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
                <a onClick={this.handleStart} title={chrome.i18n.getMessage('ML_START')} className="start"
                   href="#start"/>
                <a onClick={this.handleStop} title={chrome.i18n.getMessage('ML_STOP')} className="stop" href="#stop"/>
              </div>
            </td>
          );
          break;
        }
      }
    });

    const classList = [];
    if (this.torrentStore.selected) {
      classList.push('selected');
    }

    return (
      <TorrentContextMenu torrentId={torrent.id}>
        <tr className={classList.join(' ')} id={torrent.id} onDoubleClick={this.handleDblClick}>
          {columns}
        </tr>
      </TorrentContextMenu>
    );
  }
}

// Global style cache for TorrentName animations
const styleCache = new Map();

function getOrCreateStyle(moveName, width, elWidth) {
  if (styleCache.has(moveName)) {
    const cached = styleCache.get(moveName);
    cached.useCount++;
    return moveName;
  }

  const timeCalc = Math.round(elWidth / width * 3.5);
  const style = document.createElement('style');
  style.classList.add(moveName);
  style.textContent = `@keyframes a_${moveName}{0%{margin-left:2px;}50%{margin-left:-${elWidth - width}px;}90%{margin-left:6px;}100%{margin-left:2px;}}div.${moveName}:hover>span{overflow:visible;animation:a_${moveName} ${timeCalc}s;}`;
  document.body.appendChild(style);

  styleCache.set(moveName, { style, useCount: 1 });
  return moveName;
}

function releaseStyle(moveName) {
  if (!moveName || !styleCache.has(moveName)) return;

  const cached = styleCache.get(moveName);
  cached.useCount--;

  if (cached.useCount <= 0) {
    cached.style.remove();
    styleCache.delete(moveName);
  }
}

class TorrentName extends React.PureComponent {
  static propTypes = {
    name: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
  };

  state = {
    name: null,
    width: null,
    shouldUpdateCalc: true,
    movebleClassName: null
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.name !== nextProps.name || prevState.width !== nextProps.width) {
      return {
        name: nextProps.name,
        width: nextProps.width,
        shouldUpdateCalc: true,
      };
    }
    return null;
  }

  componentWillUnmount() {
    releaseStyle(this.state.movebleClassName);
  }

  refSpan = React.createRef();

  handleMouseEnter = (e) => {
    this.setState({ shouldUpdateCalc: false });

    releaseStyle(this.state.movebleClassName);

    const width = this.props.width;
    const spanWidth = this.refSpan.current.offsetWidth;
    if (spanWidth < width) {
      this.setState({ movebleClassName: null });
      return;
    }

    // Round elWidth to reduce unique style combinations
    let elWidth = Math.ceil(spanWidth / 50) * 50;
    if (elWidth < 100) elWidth = 100;

    const moveName = `mv_${width}_${elWidth}`;
    getOrCreateStyle(moveName, width, elWidth);

    this.setState({ movebleClassName: moveName });
  };

  render() {
    let classList = ['title'];

    let onMouseEnter = null;
    if (this.state.shouldUpdateCalc) {
      onMouseEnter = this.handleMouseEnter;
    } else
    if (this.state.movebleClassName) {
      classList.push(this.state.movebleClassName);
    }

    return (
      <div className={classList.join(' ')}>
        <span ref={this.refSpan} onMouseEnter={onMouseEnter} title={this.props.name}>{this.props.name}</span>
      </div>
    );
  }
}

export default TorrentListTableItem;