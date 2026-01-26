import {getRoot, types} from "mobx-state-tree";

/**
 * @typedef {Object} TorrentDetailsDialogStore
 * @property {string} id
 * @property {string} type
 * @property {number} torrentId
 * @property {function} close
 * @property {*} torrent
 */
const TorrentDetailsDialogStore = types.model('TorrentDetailsDialogStore', {
  id: types.identifier,
  type: types.literal('torrentDetails'),
  torrentId: types.number,
}).views((self) => {
  return {
    get torrent() {
      /**@type RootStore*/const rootStore = getRoot(self);
      return rootStore.client.torrents.get(self.torrentId);
    },
    close() {
      /**@type RootStore*/const rootStore = getRoot(self);
      rootStore.destroyDialog(self.id);
    }
  };
});

export default TorrentDetailsDialogStore;
