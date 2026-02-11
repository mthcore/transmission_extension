import { filesize } from 'filesize';

const sizeList: string[] = JSON.parse(chrome.i18n.getMessage('sizeList'));
const sizePsList: string[] = JSON.parse(chrome.i18n.getMessage('sizePsList'));

export const formatBytes = (bytes: number): string => {
  return filesize(bytes, { fullform: true, fullforms: sizeList }) as string;
};

export const formatSpeed = (bytes: number): string => {
  return filesize(bytes, { fullform: true, fullforms: sizePsList }) as string;
};

export function speedToStr(speed: number): string {
  if (!Number.isFinite(speed)) {
    return '';
  }
  return formatSpeed(speed);
}
