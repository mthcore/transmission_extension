import { types, Instance } from 'mobx-state-tree';
import BaseDialogStore from './BaseDialogStore';

const RemoveConfirmDialogStore = types.compose(
  'RemoveConfirmDialogStore',
  BaseDialogStore,
  types.model({
    type: types.literal('removeConfirm'),
    torrentIds: types.array(types.number),
  })
);

export type IRemoveConfirmDialogStore = Instance<typeof RemoveConfirmDialogStore>;
export default RemoveConfirmDialogStore;
