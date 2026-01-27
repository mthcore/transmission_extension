import ErrorWithCode from "./errorWithCode";
import base64ToArrayBuffer from "./base64ToArrayBuffer";

interface DownloadResult {
  blob: Blob;
}

interface FetchResponse {
  result?: {
    response: {
      headers: [string, string][];
    };
    base64: string;
  };
  error?: {
    message: string;
    code?: string;
    name?: string;
  };
}

interface ExtendedError extends Error {
  code?: string;
}

async function downloadFileFromTab(
  url: string,
  tabId: number,
  frameId?: number
): Promise<DownloadResult> {
  if (!/^https?:/.test(url)) {
    throw new ErrorWithCode('Link is not supported', 'LINK_IS_NOT_SUPPORTED');
  }

  await executeScriptPromise(tabId, {
    file: 'tabUrlFetch.js',
    frameId: frameId
  });

  return tabsSendMessage<FetchResponse | undefined>(tabId, {
    action: 'fetchUrl',
    url: url
  }, {
    frameId: frameId
  }).then((response) => {
    if (!response) {
      throw new Error('Response is empty');
    }
    if (response.error) {
      const err: ExtendedError = new Error(response.error.message || 'Unknown error');
      if (response.error.code) err.code = response.error.code;
      if (response.error.name) err.name = response.error.name;
      throw err;
    }
    return response.result!;
  }).then(({ response, base64 }) => {
    const arrayBuffer = base64ToArrayBuffer(base64);
    const headers = new Headers(response.headers);

    return new Blob([arrayBuffer], {
      type: headers.get('Content-type') || undefined
    });
  }).then(blob => ({ blob }));
}

interface ScriptOptions {
  file: string;
  frameId?: number;
}

const executeScriptPromise = (tabId: number, options: ScriptOptions): Promise<unknown[]> => {
  const target: chrome.scripting.InjectionTarget = { tabId: tabId };
  if (options.frameId !== undefined) {
    (target as { frameIds?: number[] }).frameIds = [options.frameId];
  }
  return chrome.scripting.executeScript({
    target: target,
    files: [options.file]
  }).then(results => results.map(r => r.result as unknown));
};

const tabsSendMessage = <T>(
  tabId: number,
  message: unknown,
  options?: { frameId?: number }
): Promise<T> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, options || {}, (response: T) => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve(response);
    });
  });
};

export default downloadFileFromTab;
