import {getRoot, types} from "mobx-state-tree";
import ListSelectStore from "./ListSelectStore";
import {createColumnSorter, torrentColumnMap, torrentSpecialHandlers} from "../tools/sortByColumn";

const customLabels = ['ALL', 'DL', 'SEEDING', 'COMPL', 'ACTIVE', 'INACTIVE'];

const sortTorrents = createColumnSorter(torrentColumnMap, torrentSpecialHandlers);

/**
 * @typedef {ListSelectStore} TorrentListStore
 * @property {*} filters
 * @property {*} filteredTorrents
 * @property {*} sortedTorrents
 * @property {*} sortedTorrentIds
 * @property {*} _sortedIds
 * @property {function} afterCreate
 * @property {function} beforeDestroy
 */
const TorrentListStore = types.compose('TorrentListStore', ListSelectStore, types.model({

})).views((self) => {
  return {
    get filters() {
      const result = [];
      customLabels.forEach(label => result.push({label, custom: true}));
      return result;
    },
    get filteredTorrents() {
      /**@type RootStore*/const rootStore = getRoot(self);
      const filter = rootStore.config.selectedLabel;

      const result = [];
      for (const torrent of rootStore.client.torrents.values()) {
        if (filter.custom) {
          switch (filter.label) {
            case 'ALL': {
              result.push(torrent);
              break;
            }
            case 'DL': {
              if (torrent.isDownloading){
                result.push(torrent);
              }
              break;
            }
            case 'SEEDING': {
              if (torrent.isSeeding){
                result.push(torrent);
              }
              break;
            }
            case 'COMPL': {
              if (torrent.isCompleted){
                result.push(torrent);
              }
              break;
            }
            case 'ACTIVE': {
              if (torrent.isActive){
                result.push(torrent);
              }
              break;
            }
            case 'INACTIVE': {
              if (!torrent.isActive){
                result.push(torrent);
              }
              break;
            }
          }
        }
      }

      const {hideSeedingTorrents, hideFinishedTorrents, searchQuery} = rootStore.config;
      let filtered = result;

      if (hideSeedingTorrents || hideFinishedTorrents) {
        filtered = filtered.filter((torrent) => {
          if (hideSeedingTorrents && torrent.isSeeding) {
            return false;
          }
          if (hideFinishedTorrents && torrent.isFinished) {
            return false;
          }
          return true;
        });
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((torrent) =>
          torrent.name.toLowerCase().includes(query)
        );
      }

      return filtered;
    },
    get sortedTorrents() {
      /**@type RootStore*/const rootStore = getRoot(self);
      const {by, direction} = rootStore.config.torrentsSort;
      return sortTorrents(self.filteredTorrents, by, direction);
    },
    get sortedTorrentIds() {
      return self.sortedTorrents.map(torrent => torrent.id);
    },
    get _sortedIds() {
      return self.sortedTorrentIds;
    },
    afterCreate() {
      self.startSortedIdsWatcher();
    },
    beforeDestroy() {
      self.stopSortedIdsWatcher();
    }
  };
});

export default TorrentListStore;