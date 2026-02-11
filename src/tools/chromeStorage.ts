import copyData from './copyData';

type StorageArea = 'local' | 'sync' | 'session';

export const storageGet = <T = Record<string, unknown>>(
  data: string | string[] | Record<string, unknown> | null,
  area: StorageArea = 'local'
): Promise<T> => {
  return new Promise((resolve, reject) =>
    chrome.storage[area].get(data, (result) => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve(result as T);
    })
  );
};

export const storageSet = (
  data: Record<string, unknown>,
  area: StorageArea = 'local'
): Promise<void> => {
  return new Promise((resolve, reject) =>
    chrome.storage[area].set(copyData(data), () => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve();
    })
  );
};

export const storageRemove = (
  keys: string | string[],
  area: StorageArea = 'local'
): Promise<void> => {
  return new Promise((resolve, reject) =>
    chrome.storage[area].remove(keys, () => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve();
    })
  );
};
