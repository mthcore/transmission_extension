import copyData from './copyData';
import ErrorWithCode from './ErrorWithCode';
import type { ChromeMessage, ChromeResponse } from '../types';
import { MESSAGE_TIMEOUT } from '../constants';

const callApi = <T = unknown>(message: ChromeMessage): Promise<T> => {
  return new Promise<ChromeResponse<T>>((resolve, reject) => {
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new ErrorWithCode(`Message timeout: ${message.action}`, 'MESSAGE_TIMEOUT'));
      }
    }, MESSAGE_TIMEOUT);

    // copyData for Firefox, it had problems with it...
    chrome.runtime.sendMessage(copyData(message), (response: ChromeResponse<T>) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve(response);
    });
  }).then((response) => {
    if (!response) {
      throw new Error(chrome.i18n.getMessage('responseEmpty') || 'Response is empty');
    }
    if (response.error) {
      const err = new ErrorWithCode(response.error.message || 'Unknown error', response.error.code);
      if (response.error.name) err.name = response.error.name;
      throw err;
    }
    return response.result as T;
  });
};

export default callApi;
