import { getRoot, types, Instance } from "mobx-state-tree";
import formatBytes from "../tools/formatBytes";

const priorityLocaleMap = ['MF_DONT', 'MF_LOW', 'MF_NORMAL', 'MF_HIGH'];

const FileStore = types.model('FileStore', {
  name: types.identifier,
  shortName: types.string,
  size: types.number,
  downloaded: types.number,
  priority: types.number,
}).views((self) => {
  let cachedNamePartsName: string | null = null;
  let cachedNameParts: string[] = [];

  return {
    get progress(): number {
      if (self.size === 0) return 100;
      return Math.round((self.downloaded * 100 / self.size) * 10) / 10;
    },
    get progressStr(): string {
      const progress = this.progress;
      if (progress < 100) {
        return progress.toFixed(1) + '%';
      } else {
        return Math.round(progress) + '%';
      }
    },
    get sizeStr(): string {
      return formatBytes(self.size);
    },
    get downloadedStr(): string {
      return formatBytes(self.downloaded);
    },
    get priorityStr(): string {
      return chrome.i18n.getMessage(priorityLocaleMap[self.priority]);
    },
    get selected(): boolean {
      const rootStore = getRoot<{
        fileList: { _selectedIdsSet: Set<string> };
      }>(self);
      return rootStore.fileList._selectedIdsSet.has(self.name);
    },
    get nameParts(): string[] {
      if (cachedNamePartsName !== self.shortName) {
        cachedNamePartsName = self.shortName;
        cachedNameParts = cachedNamePartsName.split(/[\\/]/);
      }
      return cachedNameParts;
    },
    get normalizedName(): string {
      return this.nameParts.join('/');
    },
  };
});

export type IFileStore = Instance<typeof FileStore>;
export default FileStore;
