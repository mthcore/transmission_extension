import copyData from "./copyData";

const callApi = (message) => {
  return new Promise((resolve, reject) => {
    // copyData for Firefox, it had problems with it...
    chrome.runtime.sendMessage(copyData(message), (response) => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve(response);
    });
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
  });
};

export default callApi;