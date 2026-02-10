import ErrorWithCode from '../tools/ErrorWithCode';

export interface TransmissionResponse {
  result: string;
  arguments: Record<string, unknown>;
}

interface ErrorWithToken extends Error {
  code: string;
  status?: number;
  statusText?: string;
  token?: string;
}

interface TransportConfig {
  authenticationRequired: boolean;
  login: string;
  password: string;
}

interface TransportOptions {
  url: string;
  getConfig: () => TransportConfig;
  onConnected: () => void;
  onTokenRefresh?: () => void;
}

class TransmissionTransport {
  url: string;
  token: string | null;
  private getConfig: () => TransportConfig;
  private onConnected: () => void;
  private onTokenRefresh?: () => void;

  constructor(options: TransportOptions) {
    this.url = options.url;
    this.token = null;
    this.getConfig = options.getConfig;
    this.onConnected = options.onConnected;
    this.onTokenRefresh = options.onTokenRefresh;
  }

  sendAction(
    body: Record<string, unknown>,
    customParser?: (text: string) => TransmissionResponse
  ): Promise<TransmissionResponse> {
    return this.retryIfTokenInvalid(() => {
      return fetch(
        this.url,
        this.sign({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Transmission-Session-Id': this.token || '',
          },
          body: JSON.stringify(body),
        })
      ).then((response) => {
        if (!response.ok) {
          const error = new ErrorWithCode(
            `${response.status}: ${response.statusText}`,
            'RESPONSE_IS_NOT_OK'
          ) as ErrorWithToken;
          error.status = response.status;
          error.statusText = response.statusText;
          if (error.status === 409) {
            error.token = response.headers.get('X-Transmission-Session-Id') || undefined;
            error.code = 'INVALID_TOKEN';
          }
          throw error;
        }

        this.onConnected();

        if (customParser) {
          return response.text().then((text) => customParser(text));
        } else {
          return response.json() as Promise<TransmissionResponse>;
        }
      });
    }).then((response) => {
      if (response.result !== 'success') {
        throw new ErrorWithCode(response.result, 'TRANSMISSION_ERROR');
      }
      return response;
    });
  }

  private retryIfTokenInvalid<T>(callback: () => Promise<T>): Promise<T> {
    return Promise.resolve(callback()).catch((err: ErrorWithToken) => {
      if (err.code === 'INVALID_TOKEN') {
        this.token = err.token || null;
        this.onTokenRefresh?.();
        return callback();
      }
      throw err;
    });
  }

  private sign(fetchOptions: RequestInit): RequestInit {
    const config = this.getConfig();
    if (config.authenticationRequired) {
      if (!fetchOptions.headers) {
        fetchOptions.headers = {};
      }
      (fetchOptions.headers as Record<string, string>).Authorization =
        'Basic ' + btoa([config.login, config.password].join(':'));
    }
    return fetchOptions;
  }
}

export default TransmissionTransport;
