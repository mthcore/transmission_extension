import { filesize } from 'filesize';

const sizePsList: string[] = JSON.parse(chrome.i18n.getMessage('sizePsList'));

const formatSpeed = (bytes: number): string => {
  return filesize(bytes, {
    fullform: true,
    fullforms: sizePsList
  }) as string;
};

export default formatSpeed;
