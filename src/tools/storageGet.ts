type StorageArea = 'local' | 'sync' | 'session';

const storageGet = <T = Record<string, unknown>>(
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

export default storageGet;
