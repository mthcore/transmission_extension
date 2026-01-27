type StorageArea = 'local' | 'sync' | 'session';

const storageRemove = (
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

export default storageRemove;
