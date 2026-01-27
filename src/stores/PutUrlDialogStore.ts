import { types, Instance } from "mobx-state-tree";
import BaseDialogStore from "./BaseDialogStore";

const PutUrlDialogStore = types.compose(
  'PutUrlDialogStore',
  BaseDialogStore,
  types.model({
    type: types.literal('putUrl'),
  })
);

export type IPutUrlDialogStore = Instance<typeof PutUrlDialogStore>;
export default PutUrlDialogStore;
