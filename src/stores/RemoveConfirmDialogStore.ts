import { types, Instance } from 'mobx-state-tree';
import BaseDialogStore from './BaseDialogStore';

const RemoveConfirmDialogStore = types.compose(
  'RemoveConfirmDialogStore',
  BaseDialogStore,
  types.model({
    type: types.literal('removeConfirm'),
    torrentIds: types.array(types.number),
    deleteData: types.optional(types.boolean, false),
  })
);

export type IRemoveConfirmDialogStore = Instance<typeof RemoveConfirmDialogStore>;
export default RemoveConfirmDialogStore;
