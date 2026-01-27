import getLogger from "./getLogger";

const logger = getLogger('showError');

/**
 * Show error notification to user and log to console
 */
export function showError(message: string, error?: Error): void {
  logger.error(message, error);

  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icons/icon_48.png',
      title: chrome.i18n.getMessage('unexpectedError') || 'Error',
      message: message
    });
  }
}

export default showError;
