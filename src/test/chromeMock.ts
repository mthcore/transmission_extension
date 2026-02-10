import { vi } from 'vitest';

const chromeMock = {
  i18n: {
    getMessage: (key: string) => key,
  },
  runtime: {
    sendMessage: vi.fn(),
    lastError: null as chrome.runtime.LastError | null,
    getURL: (path: string) => path,
    openOptionsPage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn(),
    clear: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
  contextMenus: {
    create: vi.fn(),
    removeAll: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
};

Object.assign(globalThis, { chrome: chromeMock });
