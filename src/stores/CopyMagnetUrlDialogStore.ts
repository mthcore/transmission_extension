import { types, Instance } from 'mobx-state-tree';
import BaseDialogStore from './BaseDialogStore';

const CopyMagnetUrlDialogStore = types.compose(
  'CopyMagnetUrlDialogStore',
  BaseDialogStore,
  types.model({
    type: types.literal('copyMagnetUrl'),
    magnetLink: types.string,
    torrentIds: types.array(types.number),
  })
);

export type ICopyMagnetUrlDialogStore = Instance<typeof CopyMagnetUrlDialogStore>;
export default CopyMagnetUrlDialogStore;
