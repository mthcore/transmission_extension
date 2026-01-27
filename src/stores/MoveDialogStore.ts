import { types, Instance } from "mobx-state-tree";
import BaseDialogStore from "./BaseDialogStore";

const MoveDialogStore = types.compose(
  'MoveDialogStore',
  BaseDialogStore,
  types.model({
    type: types.literal('move'),
    directory: types.string,
    torrentIds: types.array(types.number)
  })
);

export type IMoveDialogStore = Instance<typeof MoveDialogStore>;
export default MoveDialogStore;
