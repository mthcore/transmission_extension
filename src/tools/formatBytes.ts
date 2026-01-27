import { filesize } from 'filesize';

const sizeList: string[] = JSON.parse(chrome.i18n.getMessage('sizeList'));

const formatBytes = (bytes: number): string => {
  return filesize(bytes, {
    fullform: true,
    fullforms: sizeList
  }) as string;
};

export default formatBytes;
