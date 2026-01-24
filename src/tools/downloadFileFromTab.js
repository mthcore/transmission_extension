import ErrorWithCode from "./errorWithCode";
import base64ToArrayBuffer from "./base64ToArrayBuffer";

async function downloadFileFromTab(url, tabId, frameId) {
  if (!/^https?:/.test(url)) {
    throw new ErrorWithCode('Link is not supported', 'LINK_IS_NOT_SUPPORTED');
  }

  await executeScriptPromise(tabId, {
    file: 'tabUrlFetch.js',
    frameId: frameId
  });

  return tabsSendMessage(tabId, {
    action: 'fetchUrl',
    url: url
  }, {
    frameId: frameId
  }).then((response) => {
    if (!response) {
      throw new Error('Response is empty');
    }
    if (response.error) {
      const err = new Error(response.error.message || 'Unknown error');
      if (response.error.code) err.code = response.error.code;
      if (response.error.name) err.name = response.error.name;
      throw err;
    }
    return response.result;
  }).then(({response, base64}) => {
    const arrayBuffer = base64ToArrayBuffer(base64);

    const headers = new Headers(response.headers);

    return new Blob([arrayBuffer], {
      type: headers.get('Content-type')
    });
  }).then(blob => ({blob}));
}

const executeScriptPromise = (tabId, options) => {
  const target = { tabId: tabId };
  if (options.frameId !== undefined) {
    target.frameIds = [options.frameId];
  }
  return chrome.scripting.executeScript({
    target: target,
    files: [options.file]
  }).then(results => results.map(r => r.result));
};

const tabsSendMessage = (tabId, message, options) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, options, (response) => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve(response);
    });
  });
};

export default downloadFileFromTab;