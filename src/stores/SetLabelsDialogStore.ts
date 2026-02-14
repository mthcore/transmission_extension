import { types, Instance } from 'mobx-state-tree';
import BaseDialogStore from './BaseDialogStore';

const SetLabelsDialogStore = types.compose(
  'SetLabelsDialogStore',
  BaseDialogStore,
  types.model({
    type: types.literal('setLabels'),
    currentLabels: types.optional(types.string, ''),
    torrentIds: types.array(types.number),
  })
);

export type ISetLabelsDialogStore = Instance<typeof SetLabelsDialogStore>;
export default SetLabelsDialogStore;
