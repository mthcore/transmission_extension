import { types, Instance } from "mobx-state-tree";
import BaseDialogStore from "./BaseDialogStore";

const PutFilesDialogStore = types.compose(
  'PutFilesDialogStore',
  BaseDialogStore,
  types.model({
    type: types.literal('putFiles'),
    isReady: types.optional(types.boolean, false),
  })
).actions((self) => ({
  setReady(value: boolean) {
    self.isReady = value;
  }
})).views(() => {
  let _files: FileList | null = null;
  return {
    set files(files: FileList | null) {
      _files = files;
    },
    get files(): FileList | null {
      return _files;
    }
  };
});

export type IPutFilesDialogStore = Instance<typeof PutFilesDialogStore>;
export default PutFilesDialogStore;
