import { getRoot, types, Instance } from "mobx-state-tree";
import BaseDialogStore from "./BaseDialogStore";
import type { ITorrentStore } from "./TorrentStore";

const TorrentDetailsDialogStore = types.compose(
  'TorrentDetailsDialogStore',
  BaseDialogStore,
  types.model({
    type: types.literal('torrentDetails'),
    torrentId: types.number,
  })
).views((self) => ({
  get torrent(): ITorrentStore | undefined {
    const rootStore = getRoot<{
      client: {
        torrents: Map<number, ITorrentStore>;
      };
    }>(self);
    return rootStore.client.torrents.get(self.torrentId);
  }
}));

export type ITorrentDetailsDialogStore = Instance<typeof TorrentDetailsDialogStore>;
export default TorrentDetailsDialogStore;
