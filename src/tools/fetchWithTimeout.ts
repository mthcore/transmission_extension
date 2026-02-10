import ErrorWithCode from './ErrorWithCode';

const DEFAULT_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ErrorWithCode(
        `Request timed out after ${timeoutMs}ms`,
        'FETCH_TIMEOUT',
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default fetchWithTimeout;
