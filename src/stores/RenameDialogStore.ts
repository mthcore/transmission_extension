import { types, Instance } from 'mobx-state-tree';
import BaseDialogStore from './BaseDialogStore';

const RenameDialogStore = types
  .compose(
    'RenameDialogStore',
    BaseDialogStore,
    types.model({
      type: types.literal('rename'),
      path: types.string,
      torrentIds: types.array(types.number),
    })
  )
  .views((self) => ({
    get name(): string | undefined {
      const parts = self.path.split(/[\\/]/);
      return parts.pop();
    },
  }));

export type IRenameDialogStore = Instance<typeof RenameDialogStore>;
export default RenameDialogStore;
