import getLogger from "./getLogger";
import storageGet from "./storageGet";
import storageSet from "./storageSet";

const logger = getLogger('loadConfig');

// OldFolder is a tuple: [unknown, path: string, label: string]
type OldFolder = [unknown, string, string];

interface OldSelectedLabel {
  label: string;
  custom: number | boolean;
}

interface NewFolder {
  path: string;
  name: string;
}

interface NewSelectedLabel {
  label: string;
  custom: boolean;
}

interface Config {
  configVersion?: number;
  selectedLabel?: NewSelectedLabel;
  showSpeedGraph?: number | boolean;
  treeViewContextMenu?: number | boolean;
  showFreeSpace?: number | boolean;
  [key: string]: unknown;
}

const oldConfigMap: Record<string, string> = {
  useSSL: 'ssl',
  ip: 'hostname',
  path: 'pathname',
  displayActiveTorrentCountIcon: 'showActiveCountBadge',
  showNotificationOnDownloadComplete: 'showDownloadCompleteNotifications',
  popupUpdateInterval: 'uiUpdateInterval',
  hideSeedStatusItem: 'hideSeedingTorrents',
  hideFinishStatusItem: 'hideFinishedTorrents',
  selectDownloadCategoryOnAddItemFromContextMenu: 'selectDownloadCategoryAfterPutTorrentFromContextMenu',
  showDefaultFolderContextMenuItem: 'putDefaultPathInContextMenu',
  folderList: 'folders',
  torrentListColumnList: 'torrentColumns',
  fileListColumnList: 'filesColumns',
};

const oldConfigDefaults = Object.keys(oldConfigMap);

const loadConfig = (keys: string | string[] | null): Promise<Config> => {
  return storageGet<Config>(keys).then((config) => {
    if (config.configVersion !== 2) {
      return storageGet<Record<string, unknown>>(oldConfigDefaults).then((oldConfig) => {
        return migrateConfig(oldConfig, config);
      }).then((config) => {
        config.configVersion = 2;
        return storageSet(config as Record<string, unknown>).then(() => config);
      });
    }
    return config;
  }).then((config) => {
    if (config.selectedLabel) {
      if (typeof config.selectedLabel.custom === "number") {
        config.selectedLabel.custom = !!config.selectedLabel.custom;
      }
    }

    (['showSpeedGraph', 'treeViewContextMenu', 'showFreeSpace'] as const).forEach((key) => {
      if (typeof config[key] === 'number') {
        (config as Record<string, unknown>)[key] = !!config[key];
      }
    });

    return config;
  });
};

function migrateConfig(oldConfig: Record<string, unknown>, config: Config): Config {
  const transformMap: Record<string, (value: unknown) => unknown> = {
    useSSL: intToBoolean,
    displayActiveTorrentCountIcon: intToBoolean,
    showNotificationOnDownloadComplete: intToBoolean,
    hideSeedStatusItem: intToBoolean,
    hideFinishStatusItem: intToBoolean,
    showSpeedGraph: intToBoolean,
    selectDownloadCategoryOnAddItemFromContextMenu: intToBoolean,
    treeViewContextMenu: intToBoolean,
    showDefaultFolderContextMenuItem: intToBoolean,
    showFreeSpace: intToBoolean,
    folderList: folderListToFolders,
    selectedLabel: selectedLabelToLabel,
  };

  Object.entries(oldConfig).forEach(([key, value]) => {
    const newKey = oldConfigMap[key];

    const transform = transformMap[key];
    if (transform) {
      value = transform(value);
    }

    (config as Record<string, unknown>)[newKey || key] = value;
  });

  function intToBoolean(value: unknown): boolean {
    return typeof value === 'boolean' ? value : !!value;
  }

  function folderListToFolders(value: unknown): NewFolder[] {
    return (value as OldFolder[]).map(([, path, label]) => {
      return {
        path,
        name: label || ''
      };
    });
  }

  function selectedLabelToLabel(value: unknown): NewSelectedLabel {
    const v = value as OldSelectedLabel;
    return {
      label: v.label,
      custom: !!v.custom
    };
  }

  return config;
}

export default loadConfig;
export { migrateConfig };
