import copyData from './copyData';

type StorageArea = 'local' | 'sync' | 'session';

const storageSet = (data: Record<string, unknown>, area: StorageArea = 'local'): Promise<void> => {
  return new Promise((resolve, reject) =>
    chrome.storage[area].set(copyData(data), () => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve();
    })
  );
};

export default storageSet;
