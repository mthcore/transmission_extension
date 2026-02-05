import ErrorWithCode from './ErrorWithCode';

interface DownloadResult {
  blob: Blob;
}

async function downloadFileFromUrl(url: string): Promise<DownloadResult> {
  if (!/^(blob|https?):/.test(url)) {
    throw new ErrorWithCode('Link is not supported', 'LINK_IS_NOT_SUPPORTED');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new ErrorWithCode(`${response.status}: ${response.statusText}`, 'RESPONSE_IS_NOT_OK');
  }

  const contentLength = response.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024 * 10) {
    throw new ErrorWithCode('Size is more then 10mb', 'FILE_SIZE_EXCEEDED');
  }

  const blob = await response.blob();
  return { blob };
}

export default downloadFileFromUrl;
