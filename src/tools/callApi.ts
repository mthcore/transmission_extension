import copyData from "./copyData";
import type { ChromeMessage, ChromeResponse } from '../types';

interface ExtendedError extends Error {
  code?: string;
}

const callApi = <T = unknown>(message: ChromeMessage): Promise<T> => {
  return new Promise<ChromeResponse<T>>((resolve, reject) => {
    // copyData for Firefox, it had problems with it...
    chrome.runtime.sendMessage(copyData(message), (response: ChromeResponse<T>) => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve(response);
    });
  }).then((response) => {
    if (!response) {
      throw new Error(chrome.i18n.getMessage('responseEmpty') || 'Response is empty');
    }
    if (response.error) {
      const err: ExtendedError = new Error(response.error.message || 'Unknown error');
      if (response.error.code) err.code = response.error.code;
      if (response.error.name) err.name = response.error.name;
      throw err;
    }
    return response.result as T;
  });
};

export default callApi;
