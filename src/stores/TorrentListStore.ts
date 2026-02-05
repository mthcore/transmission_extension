import { getRoot, types, Instance } from 'mobx-state-tree';
import ListSelectStore from './ListSelectStore';
import {
  createColumnSorter,
  torrentColumnMap,
  torrentSpecialHandlers,
} from '../tools/sortByColumn';
import type { ITorrentStore } from './TorrentStore';

const customLabels = ['ALL', 'DL', 'SEEDING', 'COMPL', 'ACTIVE', 'INACTIVE'] as const;

const sortTorrents = createColumnSorter(torrentColumnMap, torrentSpecialHandlers);

interface Filter {
  label: string;
  custom: boolean;
}

const TorrentListStore = types
  .compose('TorrentListStore', ListSelectStore, types.model({}))
  .views((self) => {
    return {
      get filters(): Filter[] {
        const result: Filter[] = [];
        customLabels.forEach((label) => result.push({ label, custom: true }));
        return result;
      },
      get filteredTorrents(): ITorrentStore[] {
        const rootStore = getRoot<{
          config: {
            selectedLabel: { label: string; custom: boolean };
            hideSeedingTorrents: boolean;
            hideFinishedTorrents: boolean;
            searchQuery: string;
          };
          client: {
            torrents: Map<number, ITorrentStore>;
          };
        }>(self);
        const filter = rootStore.config.selectedLabel;

        const result: ITorrentStore[] = [];
        for (const torrent of rootStore.client.torrents.values()) {
          if (filter.custom) {
            switch (filter.label) {
              case 'ALL': {
                result.push(torrent);
                break;
              }
              case 'DL': {
                if (torrent.isDownloading) {
                  result.push(torrent);
                }
                break;
              }
              case 'SEEDING': {
                if (torrent.isSeeding) {
                  result.push(torrent);
                }
                break;
              }
              case 'COMPL': {
                if (torrent.isCompleted) {
                  result.push(torrent);
                }
                break;
              }
              case 'ACTIVE': {
                if (torrent.isActive) {
                  result.push(torrent);
                }
                break;
              }
              case 'INACTIVE': {
                if (!torrent.isActive) {
                  result.push(torrent);
                }
                break;
              }
            }
          }
        }

        const { hideSeedingTorrents, hideFinishedTorrents, searchQuery } = rootStore.config;
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
          filtered = filtered.filter((torrent) => torrent.name.toLowerCase().includes(query));
        }

        return filtered;
      },
      get sortedTorrents(): ITorrentStore[] {
        const rootStore = getRoot<{
          config: {
            torrentsSort: { by: string; direction: 1 | -1 };
          };
        }>(self);
        const { by, direction } = rootStore.config.torrentsSort;
        return sortTorrents(
          this.filteredTorrents as unknown as { [key: string]: unknown }[],
          by,
          direction
        ) as unknown as ITorrentStore[];
      },
      get sortedTorrentIds(): number[] {
        return this.sortedTorrents.map((torrent) => torrent.id);
      },
      get _sortedIds(): number[] {
        return this.sortedTorrentIds;
      },
      afterCreate() {
        self.startSortedIdsWatcher();
      },
      beforeDestroy() {
        self.stopSortedIdsWatcher();
      },
    };
  });

export type ITorrentListStore = Instance<typeof TorrentListStore>;
export default TorrentListStore;
